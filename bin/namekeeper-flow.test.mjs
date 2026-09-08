// Contract simulation only. No real DID, signature, FedWiki or durable storage.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createPermissionGate } from '../gate/permissions.mjs';

const hash = text => 'sha256:' + crypto.createHash('sha256').update(text).digest('hex');
const from = '2026-09-08T00:00:00Z', until = '2026-09-09T00:00:00Z';
const names = ['soulbis', 'soulbae'];
const did = name => `did:example:synthetic-${name}`;

function simulation() {
  const pages = new Map(), receipts = new Map(), revoked = new Set();
  let writes = 0;
  const gate = createPermissionGate({
    reserved: names, now: () => Date.parse('2026-09-08T12:00:00Z'),
    // Test identity injection is confined to this fixture. A live adapter must
    // verify holder proof, audience, nonce and exact operation instead.
    verifyRequest: async ({ authorization }) => ({ authenticated: true, fresh: true, subject: authorization }),
    resolveNameBinding: async ({ name, resource }) => ({ verified: true, status: 'active', name, resource, subject: did(name), id: `fixture-binding-${name}`, evidenceDigest: hash(name), validFrom: from, validUntil: until }),
    resolveEntitlement: async ({ subject }) => {
      const name = names.find(n => did(n) === subject);
      return { verified: true, status: revoked.has(subject) ? 'revoked' : 'active', subject, resource: `${name}.mages.city`, id: `fixture-grant-${name}`, evidenceDigest: hash(subject), validFrom: from, validUntil: until, rung: 1, scopes: ['wiki:write'] };
    },
    executors: { 'wiki:write': async ({ plan, body }) => {
      // No await in this fixture's critical section. Real storage must commit
      // page CAS and receipt atomically, including across processes/restarts.
      if (revoked.has(plan.subject)) return { applied: false, code: 'authorization-rejected' };
      const op = plan.operation;
      const key = JSON.stringify([plan.subject, op.resource, op.operationId]);
      const previous = receipts.get(key);
      if (previous) return previous.digest === plan.operationDigest
        ? { applied: true, receiptId: previous.id }
        : { applied: false, code: 'operation-id-conflict' };
      const pageKey = JSON.stringify([op.resource, op.page]);
      const current = pages.get(pageKey);
      if ((current?.revision ?? null) !== op.expectedRevision) return { applied: false, code: 'revision-conflict' };
      const id = `simulation-receipt-${++writes}`;
      pages.set(pageKey, { body, revision: hash(body) });
      receipts.set(key, { id, digest: plan.operationDigest });
      return { applied: true, receiptId: id };
    } },
  });
  const request = (name, body, changes = {}) => ({ name, action: 'wiki:write', page: 'first-namekeeper-demo', contentDigest: hash(body), expectedRevision: null, operationId: 'fixture-operation-0001', authorization: did(name), ...changes });
  return { gate, request, pages, revoked, writes: () => writes };
}

test('two synthetic holders write own spaces, cannot cross, and retry without duplicates', async () => {
  const s = simulation();
  for (const name of names) {
    const body = JSON.stringify({ title: 'First Namekeeper Demo', story: [{ type: 'paragraph', text: `Synthetic ${name} fixture` }] });
    const request = s.request(name, body);
    const first = await s.gate.execute(request, { body });
    assert.equal(first.execution, 'applied');
    const retry = await s.gate.execute(request, { body });
    assert.equal(retry.receiptId, first.receiptId);
    const other = names.find(n => n !== name);
    assert.equal((await s.gate.execute({ ...request, name: other }, { body })).allowed, false);
    assert.equal(s.pages.get(JSON.stringify([`${name}.mages.city`, request.page])).body, body);
    s.revoked.add(did(name));
    assert.equal((await s.gate.execute(request, { body })).allowed, false);
  }
  assert.equal(s.writes(), 2); assert.equal(s.pages.size, 2);
});

test('concurrent creates, changed retries and stale edits preserve the committed page', async () => {
  const s = simulation(), body = '{"title":"Initial"}', changed = '{"title":"Updated"}';
  const first = s.request('soulbis', body);
  const competing = s.request('soulbis', body, { operationId: 'fixture-operation-0002' });
  const outcomes = await Promise.all([s.gate.execute(first, { body }), s.gate.execute(competing, { body })]);
  assert.equal(outcomes.filter(r => r.execution === 'applied').length, 1);
  assert.equal(outcomes.filter(r => r.code === 'revision-conflict').length, 1);
  assert.equal((await s.gate.execute(s.request('soulbis', changed), { body: changed })).code, 'operation-id-conflict');
  const edit = s.request('soulbis', changed, { operationId: 'fixture-operation-0003', expectedRevision: hash(body) });
  assert.equal((await s.gate.execute(edit, { body: changed })).execution, 'applied');
  assert.equal((await s.gate.execute({ ...edit, operationId: 'fixture-operation-0004' }, { body: changed })).code, 'revision-conflict');
  assert.equal(s.writes(), 2);
  assert.equal(s.pages.get(JSON.stringify(['soulbis.mages.city', first.page])).body, changed);
});
