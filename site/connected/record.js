// site/record.js — the City reads the signature beside the key.
//
// A resident's `proofs` page carries a `cityKey` slot (the shape the Swordsman's
// `vta_publish` emits — agentprivacy-mcp/docs/WEAVE_mages-city.md): the bearer's public
// key, the current κ, the prior, and a signed VTA record. This module recomputes all of
// it. It is the difference between a chip that COUNTS and a chip that VERIFIES.
//
// Isomorphic on purpose: WebCrypto only (`crypto.subtle`), no node:crypto, no imports.
// The browser runs it on load; bin/verify.mjs runs the same file in node. The gate's
// node-side reader (gate/citykey.mjs) derives κ with the same canonical rule — verify.mjs
// holds a row proving the two agree byte for byte, and a row proving this file agrees with
// the Swordsman's own lib/sign.mjs, which signs the records in the first place.
//
// The City verifies. It never issues, never stores, never scores.

export const VTA_KIND = 'agentprivacy.vta/1';

const enc = new TextEncoder();
const isHex = (s, n) => typeof s === 'string' && new RegExp(`^[0-9a-f]{${n}}$`, 'i').test(s);
const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
const bytesOf = h => new Uint8Array((h.match(/../g) || []).map(b => parseInt(b, 16)));
const subtle = () => {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Error('WebCrypto unavailable — the chip cannot verify here');
  return s;
};

/** Law-L5 canonical form: keys sorted recursively, no whitespace, `exclude` dropped at the
 *  top level, undefined dropped. Byte-identical to gate/citykey.mjs `canonical()`. */
export function canonical(value, exclude = []) {
  const canon = v => {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  };
  const c = { ...value };
  for (const k of exclude) delete c[k];
  return canon(c);
}

export async function sha256(text) {
  return 'sha256:' + hex(await subtle().digest('SHA-256', enc.encode(text)));
}

/** κ — sha256 over the key's canonical form with the top-level `kappa` excluded. */
export const kappaOf = key => sha256(canonical(key, ['kappa']));

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function base58(bytes) {
  const b = [...bytes];
  let out = '';
  let digits = [0];
  for (const byte of b) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) { carry += digits[i] << 8; digits[i] = carry % 58; carry = (carry / 58) | 0; }
    while (carry) { digits.push(carry % 58); carry = (carry / 58) | 0; }
  }
  for (const byte of b) { if (byte === 0) digits.push(0); else break; }
  for (let i = digits.length - 1; i >= 0; i--) out += B58[digits[i]];
  return out;
}

/** did:key — multicodec 0xed01 ‖ the raw 32-byte ed25519 public key, base58btc. */
export const didKeyOf = publicKeyHex => 'did:key:z' + base58(new Uint8Array([0xed, 0x01, ...bytesOf(publicKeyHex)]));

/** The Swordsman identity a public key implies. */
export const participantIdOf = publicKeyHex => (isHex(publicKeyHex, 64) ? 'ap-' + publicKeyHex.slice(0, 16).toLowerCase() : null);

async function verifySig(publicKeyHex, message, sigHex) {
  try {
    const key = await subtle().importKey('raw', bytesOf(publicKeyHex), { name: 'Ed25519' }, false, ['verify']);
    return await subtle().verify({ name: 'Ed25519' }, key, bytesOf(sigHex), enc.encode(message));
  } catch { return false; }
}

/** The bytes the Swordsman signs — the record's seven fields, canonical, in sorted order. */
export const recordMessage = r => canonical({
  kind: r.kind, publicKeyHex: r.publicKeyHex, kappa: r.kappa,
  prior: r.prior ?? null, at: r.at, walks: r.walks ?? 0, vrcs: r.vrcs ?? [],
});

/**
 * Verify a VTA record. With `key` present, also that the record names THIS key —
 * Law L5: the κ re-derived from the key equals the κ that was signed.
 * Returns { ok, why?, participantId, did, kappa, prior, at, keyMatches? }.
 */
export async function verifyRecord(rec, key = null) {
  if (!rec || rec.kind !== VTA_KIND) return { ok: false, why: `kind must be ${VTA_KIND}` };
  if (!isHex(rec.publicKeyHex, 64)) return { ok: false, why: 'publicKeyHex must be 32 bytes hex' };
  if (!isHex(rec.sig, 128)) return { ok: false, why: 'sig must be 64 bytes hex' };
  if (!/^sha256:[0-9a-f]{64}$/.test(rec.kappa || '')) return { ok: false, why: 'kappa must be sha256:<hex>' };
  const pid = participantIdOf(rec.publicKeyHex);
  if (rec.participantId && rec.participantId.toLowerCase() !== pid) return { ok: false, why: `participantId must be ${pid}` };
  const did = didKeyOf(rec.publicKeyHex);
  if (rec.did && rec.did !== did) return { ok: false, why: 'did does not derive from publicKeyHex' };
  if (!await verifySig(rec.publicKeyHex, recordMessage(rec), rec.sig)) {
    return { ok: false, why: 'signature does not verify over {kind, publicKeyHex, kappa, prior, at, walks, vrcs}' };
  }
  const out = { ok: true, participantId: pid, did, kappa: rec.kappa, prior: rec.prior ?? null, at: rec.at, walks: rec.walks ?? 0, vrcs: rec.vrcs ?? [] };
  if (key) {
    const k = await kappaOf(key);
    if (k !== rec.kappa) return { ...out, ok: false, why: `the key re-derives to ${k.slice(0, 23)}…, the record was signed over ${rec.kappa.slice(0, 23)}…` };
    if ((key.prior ?? null) !== (rec.prior ?? null)) return { ...out, ok: false, why: "the key's prior differs from the signed prior" };
    const bearer = key.identity?.publicKeyHex;
    if (bearer && bearer.toLowerCase() !== rec.publicKeyHex.toLowerCase()) return { ...out, ok: false, why: 'the key names a different bearer than the record' };
    out.keyMatches = true;
  }
  return out;
}

/**
 * Verify an AgentCard exactly as agentprivacy.ai/ceremony signs it: ed25519 over
 * JSON.stringify({participantId, displayName, publicKeyHex, grimoires, privacy, trustTier})
 * IN THAT ORDER — the plain stringify, not the sorted canon. The City never re-issues an
 * identity; this is how it checks the one a resident brought.
 */
export async function verifyCard(card) {
  if (!card || typeof card !== 'object') return { ok: false, why: 'no card' };
  if (!isHex(card.publicKeyHex, 64)) return { ok: false, why: 'publicKeyHex must be 32 bytes hex' };
  const pid = participantIdOf(card.publicKeyHex);
  if ((card.participantId || '').toLowerCase() !== pid) return { ok: false, why: `participantId must be ${pid}` };
  if (!isHex(card.signature, 128)) return { ok: false, why: 'signature must be 64 bytes hex' };
  const msg = JSON.stringify({ participantId: card.participantId, displayName: card.displayName, publicKeyHex: card.publicKeyHex, grimoires: card.grimoires, privacy: card.privacy, trustTier: card.trustTier });
  const ok = await verifySig(card.publicKeyHex, msg, card.signature);
  return ok
    ? { ok: true, participantId: pid, did: didKeyOf(card.publicKeyHex), displayName: card.displayName, trustTier: card.trustTier }
    : { ok: false, why: 'signature does not verify over the card payload' };
}

/**
 * evolved_since(t) — a signed evolution landed after t. A stale κ is a stale agent.
 * `horizonDays` is the bearer's own expiry on the reading.
 */
export async function evolvedSince(rec, since, { horizonDays = null, now = new Date() } = {}) {
  const v = await verifyRecord(rec);
  if (!v.ok) return { predicate: 'evolved_since', ok: false, why: v.why };
  const t = new Date(since), at = new Date(rec.at);
  if (isNaN(t.getTime()) || isNaN(at.getTime())) return { predicate: 'evolved_since', ok: false, why: 'bad timestamp' };
  const expires = horizonDays == null ? null : new Date(at.getTime() + horizonDays * 864e5);
  const expired = expires != null && now > expires;
  const holds = at >= t && !expired;
  return { predicate: 'evolved_since', ok: holds, holds, since: t.toISOString(), signedAt: at.toISOString(), expires: expires ? expires.toISOString() : null, expired };
}

/**
 * The `cityKey` slot on a resident's `proofs` page → what the chip may say.
 * `verified` is the only word the chip is allowed to use, and only when the signature
 * checked here. Everything else reads `unproven` — never a lower score, just less shown.
 */
export async function readCityKeySlot(slot, { card = null, horizonDays = 90, now = new Date() } = {}) {
  if (!slot || typeof slot !== 'object') return { present: false, verified: false, why: 'no cityKey slot' };
  const out = { present: true, verified: false, kappa: slot.kappa || null, prior: slot.prior ?? null, did: slot.did || null, signedAt: slot.signedAt || null, walks: 0, vrcs: 0 };
  const rec = slot.vta;
  if (!rec) return { ...out, why: 'the slot publishes no signed record' };
  const v = await verifyRecord(rec);
  if (!v.ok) return { ...out, why: v.why };
  // the slot's own summary must agree with what was signed
  if (slot.kappa && slot.kappa !== rec.kappa) return { ...out, why: 'the slot names a κ the record did not sign' };
  if (slot.did && slot.did !== v.did) return { ...out, why: 'the slot names a did the key does not derive' };
  // one identity: the agent-card and the record must be the same agent, or the chip says so
  if (card?.publicKeyHex && card.publicKeyHex.toLowerCase() !== rec.publicKeyHex.toLowerCase()) {
    return { ...out, why: 'the agent-card and the record are two different agents' };
  }
  const live = await evolvedSince(rec, rec.at, { horizonDays, now });
  return {
    ...out, verified: true, kappa: rec.kappa, prior: v.prior, did: v.did, signedAt: rec.at,
    participantId: v.participantId, walks: v.walks, vrcs: (v.vrcs || []).length,
    live: !live.expired, expires: live.expires, cardMatches: !!card?.publicKeyHex,
  };
}
