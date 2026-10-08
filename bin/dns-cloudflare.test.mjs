import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudflareExecutor } from '../gate/dns-cloudflare.mjs';

// A fake Cloudflare: records keyed by id; answers GET ?name=&type=, POST, PATCH, DELETE.
function cloud() {
  const records = new Map(); let n = 0; const calls = [];
  const fetch = async (url, init = {}) => {
    const u = new URL(url); calls.push({ method: init.method, path: u.pathname + u.search, auth: init.headers?.Authorization });
    const ok = result => ({ ok: true, status: 200, json: async () => ({ success: true, result }) });
    if (!init.headers?.Authorization?.startsWith('Bearer ')) return { ok: false, status: 403, json: async () => ({ success: false, errors: [{ message: 'no token' }] }) };
    if (init.method === 'GET') { const name = u.searchParams.get('name'), type = u.searchParams.get('type'); return ok([...records.values()].filter(r => (!name || r.name === name) && (!type || r.type === type))); }
    if (init.method === 'POST') { const b = JSON.parse(init.body); const id = 'rec' + (++n); records.set(id, { id, ...b }); return ok({ id, ...b }); }
    if (init.method === 'PATCH') { const id = u.pathname.split('/').pop(); const b = JSON.parse(init.body); records.set(id, { id, ...b }); return ok({ id, ...b }); }
    if (init.method === 'DELETE') { const id = u.pathname.split('/').pop(); records.delete(id); return ok({ id }); }
    return { ok: false, status: 404, json: async () => ({ success: false }) };
  };
  return { fetch, records, calls };
}
const op = s => (s + '-fixture-operation').padEnd(24, '0');

test('dry-run by default: the plan comes back, nothing is sent, the journal remembers the digest', async () => {
  const c = cloud();
  const x = createCloudflareExecutor({ zoneId: 'zone-fixture', token: async () => 'tok', fetch: c.fetch });
  const r = await x.execute({ name: 'visitor', rung: 1, type: 'TXT', value: 'mages-claim v0 p1 key=abcd', sub: '_mages', operationId: op('txt1') });
  assert.equal(r.dryRun, true); assert.equal(r.applied, false); assert.equal(r.plan.body.name, '_mages.visitor.mages.city'); assert.equal(r.plan.body.type, 'TXT');
  assert.equal(c.calls.length, 0, 'dry-run sends nothing');
  assert.equal(x.journal.length, 1); assert.match(x.journal[0].digest, /^sha256:/);
  assert.equal(JSON.stringify(x.journal).includes('tok'), false, 'the token is never journaled');
});

test('the rung gates the type; fixed hosts and bad labels are refused; an operation id is required', async () => {
  const x = createCloudflareExecutor({ zoneId: 'z', token: async () => 'tok', fetch: cloud().fetch });
  assert.equal((await x.execute({ name: 'visitor', rung: 1, type: 'A', value: '203.0.113.7', operationId: op('a1') })).code, 'rung-too-low');
  assert.equal((await x.execute({ name: 'visitor', rung: 2, type: 'MX', value: 'mail', operationId: op('mx1') })).code, 'type-not-brokered');
  assert.equal((await x.execute({ name: 'vta', rung: 2, type: 'A', value: '203.0.113.7', operationId: op('vta1') })).code, 'label-invalid');
  assert.equal((await x.execute({ name: 'Bad Name', rung: 2, type: 'A', value: '203.0.113.7', operationId: op('bad1') })).code, 'label-invalid');
  assert.equal((await x.execute({ name: 'visitor', rung: 2, type: 'A', value: '203.0.113.7' })).code, 'operation-id-required');
  assert.equal((await x.delegate({ name: 'visitor', rung: 2, nameservers: ['ns1.example.net', 'ns2.example.net'], operationId: op('ns1') })).code, 'rung-too-low');
});

test('apply: create, then already-applied, then replace on change; same id + same digest replays, same id + new digest conflicts', async () => {
  const c = cloud();
  const x = createCloudflareExecutor({ zoneId: 'z', token: async () => 'tok', fetch: c.fetch, apply: true });
  const first = await x.execute({ name: 'visitor', rung: 2, type: 'A', value: '203.0.113.7', operationId: op('a1') });
  assert.equal(first.applied, true); assert.equal(c.records.size, 1); assert.equal([...c.records.values()][0].proxied, false, 'agent records are DNS-only');
  const again = await x.execute({ name: 'visitor', rung: 2, type: 'A', value: '203.0.113.7', operationId: op('a2') });
  assert.equal(again.code, 'already-applied'); assert.equal(c.records.size, 1);
  const replay = await x.execute({ name: 'visitor', rung: 2, type: 'A', value: '203.0.113.7', operationId: op('a1') });
  assert.deepEqual(replay, first, 'a retry with the same operation id and digest returns the first result');
  const conflict = await x.execute({ name: 'visitor', rung: 2, type: 'A', value: '203.0.113.8', operationId: op('a1') });
  assert.equal(conflict.code, 'operation-id-conflict');
  const changed = await x.execute({ name: 'visitor', rung: 2, type: 'A', value: '203.0.113.8', operationId: op('a3') });
  assert.equal(changed.applied, true); assert.equal(c.records.size, 1, 'one A per label: replaced, not added'); assert.equal([...c.records.values()][0].content, '203.0.113.8');
  const srv = await x.execute({ name: 'visitor', rung: 2, type: 'SRV', value: '10 5 443 visitor.mages.city', sub: '_didcomm._tcp', operationId: op('srv1') });
  assert.equal(srv.applied, true); assert.deepEqual([...c.records.values()].find(r => r.type === 'SRV').data, { priority: 10, weight: 5, port: 443, target: 'visitor.mages.city' });
});

test('rung 3 delegates with NS records; release removes everything under the name and keeps the journal', async () => {
  const c = cloud();
  const x = createCloudflareExecutor({ zoneId: 'z', token: async () => 'tok', fetch: c.fetch, apply: true });
  await x.execute({ name: 'visitor', rung: 2, type: 'TXT', value: 'mages-claim v0 p1 key=abcd', sub: '_mages', operationId: op('t1') });
  const d = await x.delegate({ name: 'visitor', rung: 3, nameservers: ['ns2.example.net.', 'ns1.example.net'], operationId: op('ns1') });
  assert.equal(d.applied, true); assert.deepEqual(d.delegation.nameservers, ['ns1.example.net', 'ns2.example.net']);
  assert.equal([...c.records.values()].filter(r => r.type === 'NS').length, 2);
  assert.equal((await x.delegate({ name: 'visitor', rung: 3, nameservers: ['only-one.example.net'], operationId: op('ns2') })).code, 'nameservers-required');
  const r = await x.release({ name: 'visitor', operationId: op('rel1'), reason: 'left the City' });
  assert.equal(r.applied, true); assert.equal(r.removed, 3); assert.equal(c.records.size, 0);
  assert.equal(x.journal.length, 3, 'the journal keeps every planned or applied operation; a refusal before planning is not an operation');
});

test('without a token nothing is sent and the error names it', async () => {
  const x = createCloudflareExecutor({ zoneId: 'z', fetch: cloud().fetch, apply: true });
  await assert.rejects(() => x.execute({ name: 'visitor', rung: 1, type: 'TXT', value: 'x', operationId: op('t1') }), /no API token/);
});
