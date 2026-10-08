import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { createVtcEvidence, statusBit } from '../gate/vtc-evidence.mjs';

// Synthetic identities only. The fake daemon answers the documented routes with the documented shapes.
const ME = 'did:key:z6MkFixtureMe', A = 'did:key:z6MkFixtureA', B = 'did:key:z6MkFixtureB', C = 'did:key:z6MkFixtureC';
const encoded = bits => { const buf = Buffer.alloc(16); for (const i of bits) buf[i >> 3] |= 1 << (7 - (i & 7)); return zlib.gzipSync(buf).toString('base64url'); };
const vmc = (id, index, extra = {}) => ({ id, type: ['VerifiableCredential', 'MembershipCredential'], validFrom: '2026-10-01T00:00:00Z', validUntil: '2026-10-31T00:00:00Z', credentialStatus: { statusPurpose: 'revocation', statusListIndex: index }, ...extra });
const vwc = id => ({ id, type: ['VerifiableCredential', 'WitnessCredential'], credentialSubject: { statement: 'https://trusttasks.org/spec/vtc/witnessed/1' } });
const vrc = (issuer, subject, status = 'active') => ({ id: `vrc:${issuer.slice(-1)}${subject.slice(-1)}`, issuer, subject, status });

function daemon({ revokedBits = [], creds = {}, rels = {} } = {}) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    const u = new URL(url); calls.push({ path: u.pathname, task: init.headers?.['Trust-Task'] || null, auth: !!init.headers?.Authorization });
    const json = (status, body) => ({ status, text: async () => JSON.stringify(body) });
    let m;
    if (u.pathname === '/v1/status-lists/revocation') return json(200, { type: ['VerifiableCredential', 'BitstringStatusListCredential'], credentialSubject: { encodedList: encoded(revokedBits) } });
    if ((m = u.pathname.match(/^\/v1\/members\/([^/]+)\/credentials$/))) { const did = decodeURIComponent(m[1]); return creds[did] ? json(200, { credentials: creds[did] }) : json(404, { error: 'not a member' }); }
    if ((m = u.pathname.match(/^\/v1\/members\/([^/]+)\/relationships$/))) { const did = decodeURIComponent(m[1]); return json(200, { relationships: rels[did] || [] }); }
    return json(404, {});
  };
  return { fetch, calls };
}
const now = () => Date.parse('2026-10-08T12:00:00Z');

test('status bits decode MSB-first from a gzip base64url bitstring', () => {
  const enc = encoded([0, 5, 42]);
  assert.equal(statusBit(enc, 0), 1); assert.equal(statusBit(enc, 5), 1); assert.equal(statusBit(enc, 42), 1);
  assert.equal(statusBit(enc, 1), 0); assert.equal(statusBit(enc, 41), 0);
  assert.equal(statusBit('not-base64-gzip', 1), null); assert.equal(statusBit(enc, -1), null);
});

test('the ladder from the VTC: spoken → admitted → vouched → witnessed', async () => {
  // spoken: not a member at all
  let d = daemon();
  let ev = createVtcEvidence({ baseUrl: 'https://vtc.fixture', fetch: d.fetch, auth: async () => 'tok', now });
  let r = await ev.evidenceFor(ME);
  assert.deepEqual(r.evidence, { member: false, vouches: 0, met: 0, vwc: 0 }); assert.equal(r.rung, 0);
  // admitted: a VMC, not revoked
  d = daemon({ creds: { [ME]: [vmc('vmc:me', 7)] } });
  ev = createVtcEvidence({ baseUrl: 'https://vtc.fixture', fetch: d.fetch, auth: async () => 'tok', now });
  r = await ev.evidenceFor(ME);
  assert.equal(r.rung, 1); assert.equal(r.rungName, 'admitted'); assert.equal(r.vmc.id, 'vmc:me');
  assert.ok(d.calls.some(c => c.path.endsWith('/credentials') && c.task && c.auth), 'credentials read carries a Trust-Task and the bearer');
  assert.ok(d.calls.some(c => c.path === '/v1/status-lists/revocation' && !c.auth), 'the status list is read unauthenticated');
  // vouched: two VRCs to me from members, one of them two-way
  d = daemon({ creds: { [ME]: [vmc('vmc:me', 7)], [A]: [vmc('vmc:a', 8)], [B]: [vmc('vmc:b', 9)] }, rels: { [ME]: [vrc(A, ME), vrc(B, ME), vrc(ME, A)] } });
  ev = createVtcEvidence({ baseUrl: 'https://vtc.fixture', fetch: d.fetch, auth: async () => 'tok', now });
  r = await ev.evidenceFor(ME);
  assert.deepEqual(r.evidence, { member: true, vouches: 2, met: 1, vwc: 0 }); assert.equal(r.rung, 2);
  // witnessed: plus a VWC
  d = daemon({ creds: { [ME]: [vmc('vmc:me', 7), vwc('vwc:me')], [A]: [vmc('vmc:a', 8)], [B]: [vmc('vmc:b', 9)] }, rels: { [ME]: [vrc(A, ME), vrc(B, ME), vrc(ME, A)] } });
  ev = createVtcEvidence({ baseUrl: 'https://vtc.fixture', fetch: d.fetch, auth: async () => 'tok', now });
  r = await ev.evidenceFor(ME);
  assert.equal(r.rung, 3); assert.equal(r.rungName, 'witnessed'); assert.match(r.evidenceDigest, /^sha256:[a-f0-9]{64}$/);
});

test('revocation, a non-member voucher, a withdrawn VRC and an expired VMC each read as less, never as more', async () => {
  // revoked VMC → spoken
  let d = daemon({ revokedBits: [7], creds: { [ME]: [vmc('vmc:me', 7)] } });
  let r = await createVtcEvidence({ baseUrl: 'https://vtc.fixture', fetch: d.fetch, now }).evidenceFor(ME);
  assert.equal(r.rung, 0);
  // vouch from C who is not a member does not count; a withdrawn VRC does not count
  d = daemon({ creds: { [ME]: [vmc('vmc:me', 7)], [A]: [vmc('vmc:a', 8)] }, rels: { [ME]: [vrc(A, ME), vrc(C, ME), vrc(B, ME, 'withdrawn')] } });
  r = await createVtcEvidence({ baseUrl: 'https://vtc.fixture', fetch: d.fetch, now }).evidenceFor(ME);
  assert.deepEqual(r.evidence, { member: true, vouches: 1, met: 0, vwc: 0 }); assert.equal(r.rung, 1);
  // expired VMC → not a member
  d = daemon({ creds: { [ME]: [vmc('vmc:me', 7, { validUntil: '2026-10-02T00:00:00Z' })] } });
  r = await createVtcEvidence({ baseUrl: 'https://vtc.fixture', fetch: d.fetch, now }).evidenceFor(ME);
  assert.equal(r.evidence.member, false);
});

test('entitlement and reserved-name binding resolvers return the gate\'s shapes, or null', async () => {
  const role = { id: 'vac:soulbis', type: ['VerifiableCredential', 'VerifiableAuthorityCredential'], credentialSubject: { action: 'role:name:soulbis', at: 'did:webvh:fixture:vtc' }, validFrom: '2026-10-01T00:00:00Z', validUntil: '2026-12-31T00:00:00Z', credentialStatus: { statusPurpose: 'revocation', statusListIndex: 3 } };
  const d = daemon({ creds: { [ME]: [vmc('vmc:me', 7), role], [A]: [vmc('vmc:a', 8)], [B]: [vmc('vmc:b', 9)] }, rels: { [ME]: [vrc(A, ME), vrc(B, ME), vrc(ME, B)] } });
  const ev = createVtcEvidence({ baseUrl: 'https://vtc.fixture', fetch: d.fetch, auth: async () => 'tok', now });
  const e = await ev.entitlementResolver()({ subject: ME, resource: 'me.mages.city' });
  assert.equal(e.verified, true); assert.equal(e.status, 'active'); assert.equal(e.id, 'vmc:me'); assert.equal(e.rung, 2);
  assert.deepEqual(e.scopes, ['wiki:write', 'wiki:provision', 'dns:txt', 'dns:point']);
  const b = await ev.bindingResolver()({ name: 'soulbis', resource: 'soulbis.mages.city', subject: ME });
  assert.equal(b.verified, true); assert.equal(b.name, 'soulbis'); assert.equal(b.id, 'vac:soulbis');
  assert.equal(await ev.bindingResolver()({ name: 'soulbae', resource: 'soulbae.mages.city', subject: ME }), null);
  const d2 = daemon({ revokedBits: [3], creds: { [ME]: [vmc('vmc:me', 7), role] } });
  assert.equal(await createVtcEvidence({ baseUrl: 'https://vtc.fixture', fetch: d2.fetch, now }).bindingResolver()({ name: 'soulbis', resource: 'soulbis.mages.city', subject: ME }), null, 'a revoked role credential binds nothing');
  assert.equal(await createVtcEvidence({ baseUrl: 'https://vtc.fixture', fetch: daemon().fetch, now }).entitlementResolver()({ subject: ME, resource: 'me.mages.city' }), null, 'no VMC, no entitlement');
});
