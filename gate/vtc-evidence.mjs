// gate/vtc-evidence.mjs — the Namekeeper's evidence, read from the City's community (the VTC)
// instead of the wiki journals. Pure over an injected fetch; no keys here, ever.
//
//   rung 1 admitted   member  = a membership credential (VMC) for the subject, not revoked on the status list
//   rung 2 vouched    vouches = relationship credentials (VRC) TO the subject from members of standing
//                     met     = those where a VRC also runs the other way (both sides signed)
//   rung 3 witnessed  vwc     = witnessed statements (VWC) over a sealed run, held by the subject
//
// Wire shapes: the endpoints are upstream's (docs/03-vtc: credentials.md, personhood-and-graph.md,
// bootstrap-runbook.md). Every route but /health needs a Trust-Task header; the ids below that are
// marked `observed: false` are the family's naming pattern, not a read of the pinned source — verify
// them against the revision you pin and set them in `tasks`. Responses are read defensively through
// SHAPES; a field the daemon does not send reads as absent, never as true.
//
// The bearer token comes from `auth()`: the challenge/authenticate dance belongs to the caller's VTA
// (vtc_client / pnm), not here. This module only reads.
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { rungOf, RUNGS } from './names.mjs';

const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : (v && typeof v === 'object') ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v);

export const TASKS = {
  // id · observed in upstream source (git grep, 2026-10-08) · note
  membersList:        { id: 'https://trusttasks.org/spec/vtc/members/list/0.1', observed: true },
  relationshipsList:  { id: 'https://trusttasks.org/spec/vtc/relationships/list/0.2', observed: true },
  credentialsList:    { id: 'https://trusttasks.org/spec/vtc/members/credentials/list/0.1', observed: false, note: 'GET /v1/members/{did}/credentials is documented (credentials.md); the task id is the family pattern — verify' },
  statusList:         { id: null, observed: true, note: 'GET /v1/status-lists/{purpose} is public and unauthenticated (credentials.md); no header' },
  publicProfile:      { id: null, observed: true, note: 'GET /v1/community/public-profile is public (personhood-and-graph.md)' },
};

export const SHAPES = {
  vmc: 'a credential whose type includes "MembershipCredential" (community-lifecycle.md); validFrom/validUntil; credentialStatus.statusListIndex on the revocation list',
  vrc: 'a relationship with issuer, subject, status ∈ {active, suspended, withdrawn}; both DIDs (personhood-and-graph.md: VRCs are issued peer-to-peer, suspend/restore/withdraw)',
  vwc: 'a credential or presentation carrying a "witnessed/1" statement (personhood.rego accepts it)',
  statusList: 'BitstringStatusListCredential: credentialSubject.encodedList is base64url of a GZIP-compressed bitstring (W3C bitstring-status-list)',
};

// Decode a W3C bitstring status list; bit set = revoked/suspended for that index.
export function statusBit(encodedList, index) {
  if (typeof encodedList !== 'string' || !Number.isInteger(index) || index < 0) return null;
  let buf;
  try { buf = zlib.gunzipSync(Buffer.from(encodedList.replace(/-/g, '+').replace(/_/g, '/'), 'base64')); } catch { return null; }
  const byte = buf[index >> 3];
  if (byte === undefined) return null;
  return (byte >> (7 - (index & 7))) & 1;       // MSB-first within each byte, as the spec reads it
}

export function createVtcEvidence({ baseUrl, vtcDid = null, fetch: fetchFn = globalThis.fetch, auth = async () => null, tasks = {}, now = () => Date.now(), timeoutMs = 8000, maxIssuers = 64 } = {}) {
  if (!baseUrl) throw new Error('baseUrl (the VTC base URL, no /v1) is required');
  const T = { ...TASKS, ...Object.fromEntries(Object.entries(tasks).map(([k, id]) => [k, { ...(TASKS[k] || {}), id, observed: true }])) };
  const base = String(baseUrl).replace(/\/+$/, '');

  async function get(path, taskKey, { authed = true } = {}) {
    const headers = { Accept: 'application/json' };
    const task = T[taskKey]?.id;
    if (task) headers['Trust-Task'] = task;
    if (authed) { const tok = await auth(); if (tok) headers.Authorization = `Bearer ${tok}`; }
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
    try {
      const r = await fetchFn(base + path, { headers, signal: ctl?.signal });
      const text = await r.text();
      let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
      return { status: r.status, json };
    } finally { if (timer) clearTimeout(timer); }
  }

  const listOf = j => Array.isArray(j) ? j : Array.isArray(j?.items) ? j.items : Array.isArray(j?.credentials) ? j.credentials : Array.isArray(j?.relationships) ? j.relationships : Array.isArray(j?.members) ? j.members : [];
  const typesOf = c => [].concat(c?.type || c?.types || []).map(String);
  const isVmc = c => typesOf(c).some(t => /MembershipCredential/i.test(t));
  const isVwc = c => typesOf(c).some(t => /Witness/i.test(t)) || JSON.stringify(c?.credentialSubject || c?.statement || '').includes('witnessed/1');
  const didOf = x => typeof x === 'string' ? x : x?.id || x?.did || null;

  // the revocation list, fetched once per evidence call
  async function revoked(statusRef) {
    const purpose = statusRef?.statusPurpose || 'revocation';
    const idx = Number(statusRef?.statusListIndex);
    if (!Number.isInteger(idx)) return null;
    const r = await get(`/v1/status-lists/${encodeURIComponent(purpose)}`, 'statusList', { authed: false });
    const enc = r.json?.credentialSubject?.encodedList;
    return statusBit(enc, idx);
  }

  async function credentials(did) {
    const r = await get(`/v1/members/${encodeURIComponent(did)}/credentials`, 'credentialsList');
    if (r.status === 404) return { status: 404, list: [] };
    return { status: r.status, list: listOf(r.json) };
  }
  async function relationships(did) {
    const r = await get(`/v1/members/${encodeURIComponent(did)}/relationships`, 'relationshipsList');
    if (r.status === 404) return { status: 404, list: [] };
    return { status: r.status, list: listOf(r.json) };
  }

  // The Namekeeper's evidence for a subject DID. Never throws on a daemon answer; throws on transport.
  async function evidenceFor(did) {
    const t = now();
    const creds = await credentials(did);
    const vmcs = creds.list.filter(isVmc);
    let vmc = null, member = false;
    for (const c of vmcs) {
      const from = Date.parse(c.validFrom || c.issuanceDate || 0), until = Date.parse(c.validUntil || c.expirationDate || 0);
      const inWindow = (!from || from <= t) && (!until || until > t);
      const bit = c.credentialStatus ? await revoked(c.credentialStatus) : 0;
      if (inWindow && bit === 0) { vmc = c; member = true; break; }
    }
    const vwc = creds.list.filter(isVwc).length;
    // relationships: VRCs to the subject from members of standing (= holders of an unrevoked VMC)
    const rel = await relationships(did);
    const toMe = rel.list.filter(r => didOf(r.subject) === did && (r.status || 'active') === 'active');
    const fromMe = new Set(rel.list.filter(r => didOf(r.issuer) === did && (r.status || 'active') === 'active').map(r => didOf(r.subject)));
    let vouches = 0, met = 0; const issuers = [];
    for (const r of toMe.slice(0, maxIssuers)) {
      const issuer = didOf(r.issuer); if (!issuer || issuer === did) continue;
      const ic = await credentials(issuer);
      const standing = ic.list.filter(isVmc).length > 0;   // of standing = a member; revocation of the issuer is checked by the daemon on list, and by us lazily below
      if (!standing) continue;
      vouches++; issuers.push(issuer);
      if (fromMe.has(issuer)) met++;
    }
    const evidence = { member, vouches, met, vwc };
    const rung = rungOf(evidence);
    return {
      evidence, rung, rungName: RUNGS[rung].name,
      evidenceDigest: 'sha256:' + sha(canon({ did, evidence, vmc: vmc?.id || null, issuers, at: new Date(t).toISOString().slice(0, 10) })),
      vmc: vmc ? { id: vmc.id || null, validFrom: vmc.validFrom || vmc.issuanceDate || null, validUntil: vmc.validUntil || vmc.expirationDate || null } : null,
      source: { baseUrl: base, vtcDid, credentials: creds.status, relationships: rel.status },
    };
  }

  // The permission gate's `resolveEntitlement` — an active VMC is the entitlement to the subject's own space.
  function entitlementResolver({ scopesForRung = r => (r >= 1 ? ['wiki:write', 'wiki:provision', 'dns:txt'] : []).concat(r >= 2 ? ['dns:point'] : []).concat(r >= 3 ? ['dns:any'] : []) } = {}) {
    return async ({ subject, resource }) => {
      const ev = await evidenceFor(subject);
      if (!ev.vmc) return null;
      return { verified: true, status: 'active', subject, resource, id: ev.vmc.id || ('vmc:' + ev.evidenceDigest.slice(7, 23)), evidenceDigest: ev.evidenceDigest, validFrom: ev.vmc.validFrom, validUntil: ev.vmc.validUntil, scopes: scopesForRung(ev.rung), rung: ev.rung };
    };
  }

  // The permission gate's `resolveNameBinding` for reserved names: a role credential at the community
  // whose action names the reserved name (role:name:<name>). Returns null when none is held.
  function bindingResolver() {
    return async ({ name, resource, subject }) => {
      const creds = await credentials(subject);
      const want = `role:name:${String(name).toLowerCase()}`;
      const c = creds.list.find(x => typesOf(x).some(t => /Authority|Role/i.test(t)) && JSON.stringify(x.credentialSubject || x).includes(want));
      if (!c) return null;
      const bit = c.credentialStatus ? await revoked(c.credentialStatus) : 0;
      if (bit !== 0) return null;
      return { verified: true, status: 'active', name: String(name).toLowerCase(), resource, subject, id: c.id || ('vac:' + sha(canon(c)).slice(0, 16)), evidenceDigest: 'sha256:' + sha(canon(c)), validFrom: c.validFrom || c.issuanceDate || null, validUntil: c.validUntil || c.expirationDate || null };
    };
  }

  return { evidenceFor, entitlementResolver, bindingResolver, tasks: T, shapes: SHAPES };
}
