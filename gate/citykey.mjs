#!/usr/bin/env node
// gate/citykey.mjs — the City Key reader: re-derive, never trust.
//
// The City Key is the content-addressed object an agent carries around the ecosystem's trust
// tasks — minted at agentprivacy.ai/ceremony, filled by the workshops' proof packets, evolved on
// soulbis.com/star, walked across the guide — and it is what mages.city READS at the gate, the
// Namekeeper and the Exchange instead of asking for evidence fresh. This module holds the
// recipes byte-for-byte as agentprivacy_master/src/lib/{city-key,proof-packet,proof-packet-digest}.ts
// define them (Law L5: keys sorted recursively, no whitespace, the label excluded), so a key
// verified here is the same key the star pages verify:
//
//   κ (kappa)      sha256 over the key's canonical form, top-level `kappa` excluded         → "sha256:<hex>"
//   packet proof   sha256 over the packet's canonical form, `proof` excluded, undefined dropped
//   packets.root   Merkle root: leaves = proofs sorted; node = sha256("left|right"); odd promoted;
//                  conformance vector: leaves sha256("packet-alpha"|"packet-beta"|"packet-gamma")
//                                       → sha256:07f20f689c8bef2d8a9a2a71d94e7014ea8398cc603b0ff72dadba5c517983d1
//   did:key        "did:key:" + base58btc(0xed01 ‖ raw 32-byte ed25519 public key)  (z6Mk…)
//   walks.element  sha256("<vertex>|<slug>|<sorted links>")   (PLAN_KNOWLEDGE_GRAPH_TO_VTA, 2026-09-05)
//
// Zero dependencies.
//   node gate/citykey.mjs conformance                                   # the Merkle vector must hold
//   node gate/citykey.mjs verify <key.json> [--packets <packets.json>]  # κ · packets · did · prior · walks
//   node gate/citykey.mjs evidence <key.json> --graph '{"member":true,"vouches":2,"met":1,"vwc":0}'

import fs from 'node:fs';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const hex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');
export const sha256 = text => 'sha256:' + crypto.createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');

// Law-L5 canonical form: keys sorted recursively, no whitespace, `exclude` keys dropped at the top level, undefined dropped.
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
export const kappaOf = key => sha256(canonical(key, ['kappa']));
export const packetProofOf = packet => sha256(canonical(packet, ['proof']));

export function packetsRoot(proofs) {
  let level = proofs.filter(p => typeof p === 'string' && p.length).sort();
  if (!level.length) return null;
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) next.push(i + 1 < level.length ? sha256(level[i] + '|' + level[i + 1]) : level[i]);
    level = next;
  }
  return level[0];
}
export const CONFORMANCE_ROOT = 'sha256:07f20f689c8bef2d8a9a2a71d94e7014ea8398cc603b0ff72dadba5c517983d1';
export function conformance() {
  const root = packetsRoot(['packet-alpha', 'packet-beta', 'packet-gamma'].map(sha256));
  return { ok: root === CONFORMANCE_ROOT, root, expected: CONFORMANCE_ROOT };
}

// base58btc (the Bitcoin alphabet) for did:key
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function base58(bytes) {
  let zeros = 0; while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  let n = BigInt('0x' + hex(bytes)); let out = '';
  while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
  return '1'.repeat(zeros) + out;
}
export function didKeyOf(publicKeyHex) {
  if (!/^[0-9a-f]{64}$/i.test(publicKeyHex || '')) return null;
  return 'did:key:z' + base58(Buffer.concat([Buffer.from([0xed, 0x01]), Buffer.from(publicKeyHex, 'hex')]));
}
export const participantIdOf = publicKeyHex => (/^[0-9a-f]{64}$/i.test(publicKeyHex || '') ? 'ap-' + publicKeyHex.slice(0, 16).toLowerCase() : null);
export const walkElement = (vertex, slug, links = []) => sha256(`${vertex}|${slug}|${[...links].sort().join(',')}`);

// ---- verification -------------------------------------------------------------------------------
export function verifyPacket(packet) {
  const expected = packetProofOf(packet);
  return { ok: expected === packet.proof, expected, stamped: packet.proof || null, mode: packet.payloadMode || null, vertex: packet.vertex ?? null, shop: packet.shopHref || null };
}
export function verifyKey(key, packets = []) {
  const findings = [];
  const expected = kappaOf(key);
  const kappaOk = !key.kappa ? null : expected === key.kappa;
  if (kappaOk === false) findings.push(`κ mismatch: stamped ${key.kappa} · re-derived ${expected}`);
  if (kappaOk === null) findings.push('no κ stamped — an unexported working key; nothing to compare');
  const pk = packets.map(verifyPacket);
  const bad = pk.filter(p => !p.ok);
  if (bad.length) findings.push(`${bad.length} packet proof(s) do not re-derive`);
  let rootOk = null;
  if (key.packets?.root) {
    if (packets.length) { const root = packetsRoot(packets.map(p => p.proof)); rootOk = root === key.packets.root && packets.length === (key.packets.count ?? packets.length); if (!rootOk) findings.push(`packets.root ${key.packets.root} (count ${key.packets.count}) ≠ Merkle over the ${packets.length} packets given (${root})`); }
    else findings.push(`key claims ${key.packets.count ?? '?'} packets (root ${key.packets.root.slice(0, 20)}…) — none given to re-derive`);
  }
  let didOk = null;
  if (key.did && key.identity?.publicKeyHex) { const d = didKeyOf(key.identity.publicKeyHex); didOk = d === key.did; if (!didOk) findings.push(`did ${key.did} is not did:key of identity.publicKeyHex (${d})`); }
  else if (key.did) findings.push('did present without identity.publicKeyHex — cannot bind it to the card key');
  const walks = (key.walks || []).map(w => ({ name: w.name || null, steps: (w.steps || []).length, elementsOk: (w.steps || []).every(s => /^sha256:[0-9a-f]{64}$/.test(s.element || '')) }));
  return {
    ok: kappaOk !== false && bad.length === 0 && rootOk !== false && didOk !== false,
    kappa: { stamped: key.kappa || null, expected, ok: kappaOk },
    packets: { given: packets.length, verified: pk.filter(p => p.ok).length, root: key.packets || null, rootOk, byMode: pk.reduce((m, p) => { if (p.ok) m[p.mode] = (m[p.mode] || 0) + 1; return m; }, {}) },
    identity: { publicKeyHex: key.identity?.publicKeyHex || null, participantId: participantIdOf(key.identity?.publicKeyHex), trustTier: key.identity?.trustTier || null, drakeOrb: key.identity?.drakeOrb || null, did: key.did || null, didOk },
    prior: key.prior || null, lit: (key.lit || []).length, walks, charts: (key.charts || []).length,
    findings,
  };
}

// ---- evidence for the Namekeeper's ladder and the front's chip --------------------------------------
// The key supplies the PROVEN half (who, what was walked); the graph supplies the RELATIONAL half
// (membership, vouches, met, witness credentials). Both are inputs; neither is stored as a score.
export function evidenceOf(key, packets = [], graph = {}) {
  const v = verifyKey(key, packets);
  const proven = v.packets.verified;
  return {
    // the Namekeeper's rungOf() reads these four
    member: !!graph.member, vouches: Number(graph.vouches) || 0, met: Number(graph.met) || 0, vwc: Number(graph.vwc) || 0,
    // the chip reads these
    tier: v.identity.trustTier || 'blade', participantId: v.identity.participantId, did: v.identity.did, didOk: v.identity.didOk,
    packets: proven, sealed: v.packets.byMode.sealed || 0, revealed: v.packets.byMode.revealed || 0, refractive: v.packets.byMode.refractive || 0,
    walks: v.walks.length, prior: !!v.prior, kappaOk: v.kappa.ok,
    proven: proven > 0 && v.ok,
    findings: v.findings,
  };
}
export function chipOf(e, forks = 0) {
  const bits = [e.tier];
  bits.push(e.proven ? `${e.packets} packets` : 'unproven');
  if (e.walks) bits.push(`${e.walks} walks`);
  bits.push(`vouched ×${forks}`);
  if (e.kappaOk === false) bits.push('κ MISMATCH');
  return bits.join(' · ');
}

// ---- CLI --------------------------------------------------------------------------------------------
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [cmd, file, ...rest] = process.argv.slice(2);
  const flag = k => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : undefined; };
  const out = o => console.log(JSON.stringify(o, null, 2));
  if (cmd === 'conformance') { const c = conformance(); out(c); process.exit(c.ok ? 0 : 1); }
  else if (cmd === 'verify' || cmd === 'evidence') {
    const key = JSON.parse(fs.readFileSync(file, 'utf8'));
    const packets = flag('--packets') ? JSON.parse(fs.readFileSync(flag('--packets'), 'utf8')) : [];
    if (cmd === 'verify') { const v = verifyKey(key, Array.isArray(packets) ? packets : packets.packets || []); out(v); process.exit(v.ok ? 0 : 1); }
    let graph = {}; try { graph = JSON.parse(flag('--graph') || '{}'); } catch { /* empty */ }
    out(evidenceOf(key, Array.isArray(packets) ? packets : packets.packets || [], graph));
  } else { console.log('usage: citykey.mjs conformance | verify <key.json> [--packets p.json] | evidence <key.json> [--packets p.json] [--graph json]'); process.exit(2); }
}
