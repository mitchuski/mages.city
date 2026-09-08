import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createPermissionGate } from '../gate/permissions.mjs';

const subject = 'did:key:fixture', H = 'sha256:' + 'a'.repeat(64);
const time = Date.parse('2026-09-07T12:00:00Z');
const entitlement = () => ({ verified: true, status: 'active', subject, resource: 'visitor.mages.city', id: 'fixture-entitlement', evidenceDigest: H, validFrom: '2026-09-07T11:00:00Z', validUntil: '2026-09-07T13:00:00Z', rung: 1, scopes: ['wiki:provision', 'wiki:write', 'dns:TXT'] });
const setup = (e = entitlement(), verifyRequest = async () => ({ authenticated: true, fresh: true, subject })) => createPermissionGate({ verifyRequest, resolveEntitlement: async () => e, now: () => time });
const write = () => ({ name: 'visitor', action: 'wiki:write', page: 'first-reflection', contentDigest: H, operationId: 'fixture-operation-0001', expectedRevision: null });

// Synthetic identities only: these tests do not assign real cast identities.
const castBinding = () => ({ verified: true, status: 'active', name: 'soulbis', subject, resource: 'soulbis.mages.city', id: 'fixture-binding', evidenceDigest: H, validFrom: '2026-09-07T11:00:00Z', validUntil: '2026-09-07T13:00:00Z' });
const castGate = (resolveNameBinding = async () => castBinding(), e = { ...entitlement(), resource: 'soulbis.mages.city' }, executors = {}) => createPermissionGate({ reserved: ['soulbis', 'soulbae'], now: () => time, verifyRequest: async () => ({ authenticated: true, fresh: true, subject }), resolveEntitlement: async () => e, resolveNameBinding, executors });
const castWrite = () => ({ ...write(), name: 'soulbis' });

test('reserved wiki access needs independent binding and VTA entitlement', async () => {
  const result = await castGate().authorize(castWrite());
  assert.equal(result.allowed, true);
  assert.equal(result.enforcement.site, 'soulbis.mages.city');
  assert.equal(result.nameBinding.id, 'fixture-binding');
  assert.equal((await castGate(undefined, null).authorize(castWrite())).allowed, false);
  assert.equal((await castGate().authorize({ ...castWrite(), name: 'soulbae' })).allowed, false);
  assert.equal((await castGate().authorize({ name: 'soulbis', action: 'wiki:provision' })).allowed, true);
});

test('caller bindings, wrong holders, stale bindings and resolver failures deny', async () => {
  const invalid = [null, { ...castBinding(), verified: false }, { ...castBinding(), status: 'revoked' }, { ...castBinding(), subject: 'did:key:other-fixture' }, { ...castBinding(), name: 'soulbae' }, { ...castBinding(), resource: 'soulbae.mages.city' }, { ...castBinding(), id: '' }, { ...castBinding(), evidenceDigest: 'unverified' }, { ...castBinding(), validUntil: '2026-09-07T12:00:00Z' }, { ...castBinding(), validFrom: '2026-09-08T00:00:00Z' }];
  for (const binding of invalid) assert.equal((await castGate(async () => binding).authorize({ ...castWrite(), nameBinding: castBinding() })).allowed, false);
  assert.equal((await castGate(async () => { throw Error('offline'); }).authorize(castWrite())).allowed, false);
});

test('cast wiki binding cannot authorize infrastructure or DNS changes', async () => {
  let calls = 0;
  const gate = castGate(async () => { calls++; return castBinding(); });
  for (const name of ['wiki', 'admin', 'ns1']) assert.equal((await gate.authorize({ ...castWrite(), name })).allowed, false);
  for (const action of ['dns:write', 'dns:delegate']) assert.equal((await gate.authorize({ name: 'soulbis', action, record: { type: 'TXT', value: 'test' } })).allowed, false);
  assert.equal(calls, 0);
});

test('execution rechecks reserved-name revocation after preview', async () => {
  let revoked = false, calls = 0;
  const gate = castGate(async () => ({ ...castBinding(), status: revoked ? 'revoked' : 'active', privateData: 'never-return' }), undefined, { 'wiki:provision': async () => { calls++; return { applied: true, receiptId: 'fixture-receipt' }; } });
  const request = { name: 'soulbis', action: 'wiki:provision' };
  assert.equal((await gate.authorize(request)).allowed, true);
  const result = await gate.execute(request);
  assert.equal(result.execution, 'applied');
  assert.equal(JSON.stringify(result).includes('never-return'), false);
  revoked = true;
  assert.equal((await gate.execute(request)).allowed, false);
  assert.equal(calls, 1);
});

test('unconnected adapter and caller-supplied evidence never grant permission', async () => {
  assert.equal((await createPermissionGate().authorize({ ...write(), evidence: { member: true, rung: 3 } })).allowed, false);
  assert.equal((await setup(null).authorize({ ...write(), evidence: entitlement() })).allowed, false);
});
test('active scoped wiki entitlement produces own-site plan only', async () => {
  const result = await setup().authorize(write());
  assert.equal(result.allowed, true); assert.equal(result.execution, 'not-applied');
  assert.equal(result.enforcement.site, 'visitor.mages.city'); assert.equal(result.enforcement.crossSiteWrite, false);
  assert.equal(result.operation.contentDigest, H);
});
test('reserved/cross-site names, page traversal and wrong subject denied', async () => {
  for (const name of ['wiki', 'soulbis', 'visitor.other', '../visitor', 'visitor-', '123']) assert.equal((await setup().authorize({ ...write(), name })).allowed, false);
  assert.equal((await setup().authorize({ ...write(), page: '../owner' })).allowed, false);
  assert.equal((await setup({ ...entitlement(), subject: 'did:key:someone-else' }).authorize(write())).allowed, false);
  assert.equal((await setup({ ...entitlement(), resource: 'other.mages.city' }).authorize(write())).allowed, false);
});
test('expired, revoked, unavailable and stale authentication denied', async () => {
  for (const e of [{ ...entitlement(), validUntil: '2026-09-07T12:00:00Z' }, { ...entitlement(), status: 'revoked' }, { ...entitlement(), verified: false }]) assert.equal((await setup(e).authorize(write())).allowed, false);
  assert.equal((await setup(entitlement(), async () => ({ authenticated: true, fresh: false, subject })).authorize(write())).allowed, false);
  assert.equal((await setup(entitlement(), async () => { throw Error('offline'); }).authorize(write())).allowed, false);
});
test('rung and explicit DNS scope both apply; no command injection', async () => {
  const request = { name: 'visitor', action: 'dns:write', record: { type: 'TXT', value: 'hello', sub: '_profile' } };
  assert.equal((await setup().authorize(request)).allowed, true);
  const a = { ...request, record: { type: 'A', value: '192.0.2.1' } };
  assert.equal((await setup({ ...entitlement(), scopes: ['dns:A'] }).authorize(a)).allowed, false);
  assert.equal((await setup({ ...entitlement(), rung: 2, scopes: ['dns:A'] }).authorize(a)).allowed, true);
  for (const record of [{ type: 'TXT', value: 'x\nupdate delete mages.city. ANY' }, { type: 'TXT', value: 'x', sub: 'escape.' }, { type: 'TXT', value: 'x', ttl: -1 }]) assert.equal((await setup().authorize({ ...request, record })).allowed, false);
});
test('direct delegation needs explicit grant and scopes TSIG to own subtree', async () => {
  const r = { name: 'visitor', action: 'dns:delegate' };
  assert.equal((await setup({ ...entitlement(), rung: 3 }).authorize(r)).allowed, false);
  const allowed = await setup({ ...entitlement(), rung: 3, scopes: ['dns:delegate'] }).authorize(r);
  assert.equal(allowed.allowed, true); assert.equal(allowed.enforcement.keyName, 'visitor.mages.city.');
  assert.equal(allowed.enforcement.rule, 'selfsub'); assert.equal('secret' in allowed.enforcement, false);
});
test('authentication sees content and exact target; adapter cannot mutate operation', async () => {
  let observed;
  const gate = setup(entitlement(), async ({ operation }) => { observed = structuredClone(operation); operation.resource = 'other.mages.city'; return { authenticated: true, fresh: true, subject }; });
  const result = await gate.authorize(write());
  assert.equal(observed.resource, 'visitor.mages.city'); assert.equal(observed.contentDigest, H);
  assert.equal(observed.operationId, write().operationId); assert.equal(observed.expectedRevision, null);
  assert.equal(result.resource, 'visitor.mages.city'); assert.equal(result.operation.resource, 'visitor.mages.city');
});

test('wiki writes require explicit revision and operation ID before authentication', async () => {
  let calls = 0;
  const gate = setup(entitlement(), async () => { calls++; return { authenticated: true, fresh: true, subject }; });
  for (const operationId of [undefined, '', 'short', '../escape-0123456789', 123]) assert.equal((await gate.authorize({ ...write(), operationId })).allowed, false);
  for (const expectedRevision of [undefined, '', '*', 123, 'sha256:invalid']) assert.equal((await gate.authorize({ ...write(), expectedRevision })).allowed, false);
  assert.equal(calls, 0);
  const original = await gate.authorize(write());
  for (const change of [{ operationId: 'fixture-operation-0002' }, { expectedRevision: H }]) {
    const changed = await gate.authorize({ ...write(), ...change });
    assert.equal(changed.allowed, true); assert.notEqual(changed.operationDigest, original.operationDigest);
  }
});

test('known no-effect conflicts are distinguished from ambiguous executor failures', async () => {
  const body = '{}', request = { ...write(), contentDigest: 'sha256:' + crypto.createHash('sha256').update(body).digest('hex') };
  let reply;
  const gate = createPermissionGate({ now: () => time, verifyRequest: async () => ({ authenticated: true, fresh: true, subject }), resolveEntitlement: async () => entitlement(), executors: { 'wiki:write': async () => reply } });
  for (const code of ['revision-conflict', 'operation-id-conflict', 'authorization-rejected']) {
    reply = { applied: false, code, secret: 'hidden' };
    const result = await gate.execute(request, { body });
    assert.equal(result.execution, 'not-applied'); assert.equal(result.code, code); assert.equal('secret' in result, false);
  }
  reply = { applied: false, code: 'unknown' };
  assert.equal((await gate.execute(request, { body })).execution, 'unconfirmed');
});

test('execution binds actual wiki content, rechecks revocation and filters secrets', async () => {
  const body = '{"title":"First reflection","story":[]}';
  const request = { ...write(), contentDigest: 'sha256:' + crypto.createHash('sha256').update(body).digest('hex') };
  let revoked = false, calls = 0;
  const gate = createPermissionGate({ now: () => time,
    verifyRequest: async () => ({ authenticated: true, fresh: true, subject }),
    resolveEntitlement: async () => ({ ...entitlement(), status: revoked ? 'revoked' : 'active' }),
    executors: { 'wiki:write': async ({ plan, body: text }) => { calls++; assert.equal(plan.resource, 'visitor.mages.city'); assert.equal(text, body); return { applied: true, receiptId: 'fixture-receipt', secret: 'must-not-return' }; } },
  });
  assert.equal((await gate.execute(request, { body: 'changed' })).allowed, false); assert.equal(calls, 0);
  const done = await gate.execute(request, { body });
  assert.equal(done.execution, 'applied'); assert.equal(done.receiptId, 'fixture-receipt'); assert.equal(JSON.stringify(done).includes('must-not-return'), false);
  revoked = true;
  assert.equal((await gate.execute(request, { body })).allowed, false); assert.equal(calls, 1);
});

test('missing executor and ambiguous effects are never reported as applied', async () => {
  assert.equal((await setup().execute({ name: 'visitor', action: 'wiki:provision' })).execution, 'not-applied');
  const gate = createPermissionGate({ now: () => time, verifyRequest: async () => ({ authenticated: true, fresh: true, subject }), resolveEntitlement: async () => entitlement(), executors: { 'wiki:provision': async () => { throw Error('lost connection'); } } });
  assert.equal((await gate.execute({ name: 'visitor', action: 'wiki:provision' })).execution, 'unconfirmed');
});
