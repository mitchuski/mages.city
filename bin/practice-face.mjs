// bin/practice-face.mjs — fold one face of the evidence into a copy of the practice City Key, so anyone can
// try earned light in Star Key (📤 → choose the folded key → add its chain-faces.json).
//
// The face is composed from one chain's real roots in site/seals.json, one root per state, each on the state
// its first six bits name; record and fold follow site/star.html exactly (packets rule, trace item, focus +1,
// chains root, prior κ, κ re-stamped over canonical JSON). Deterministic: run it again, get the same files.
//   node bin/practice-face.mjs [chain name]      (default: SHA-256)
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SITE = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'site');
const OUT = path.join(SITE, 'star-experiment');
const CHAIN = process.argv[2] || 'SHA-256';
const KINDS = new Set(['entry root', 'step root', 'work root', 'chain ledger']);

const sha = t => 'sha256:' + createHash('sha256').update(t, 'utf8').digest('hex');
const packets = xs => { let l = xs.filter(x => typeof x === 'string' && x).sort(); if (!l.length) return null; while (l.length > 1) { const n = []; for (let i = 0; i < l.length; i += 2) n.push(i + 1 < l.length ? sha(l[i] + '|' + l[i + 1]) : l[i]); l = n; } return l[0]; };
const canon = v => { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'; return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'; };
const kappaOf = key => { const c = { ...key }; delete c.kappa; return sha(canon(c)); };
const stateOf = k => parseInt(String(k).split(':').pop().slice(0, 2), 16) >> 2;

// the City's own vectors, so a drift in this copy of the rules fails here first
if (packets(['38|sha256:98' + 'a'.repeat(62), '1|sha256:04' + 'b'.repeat(62)]) !== 'sha256:bb0ce8ab8e08b5df9e25c0193aaafae1ddcd2d0fc95969867844aba3dd43a1b3') throw new Error('packets rule drifted from star.html');

const J = JSON.parse(fs.readFileSync(path.join(SITE, 'seals.json'), 'utf8'));
const byState = new Map();
for (const k of Object.keys(J.index).sort()) for (const h of J.index[k]) {
  if (h.chain !== CHAIN || !KINDS.has(h.kind) || !/^sha256:[0-9a-f]{64}$/.test(k)) continue;
  const s = stateOf(k);
  if (!byState.has(s)) byState.set(s, { k, chain: h.chain, kind: h.kind, ...(h.label ? { label: h.label } : {}) });
}
if (!byState.size) throw new Error(`no roots for chain ${CHAIN}`);

const order = [...byState.keys()].sort((a, b) => a - b);
const states = Object.fromEntries(order.map(v => [String(v), byState.get(v)]));
const trace = { mode: 'composed', order };
const items = [...Object.entries(states).map(([v, it]) => v + '|' + it.k), 'trace|' + trace.mode + '|' + trace.order.join('>')];
const face = { schema: 'agentprivacy.chain-face/1', name: 'a face of the evidence', composed_on: J.generated ? String(J.generated).slice(0, 10) : 'practice', source: 'https://mages.city/star.html', states, trace, root: packets(items), count: order.length };

const base = JSON.parse(fs.readFileSync(path.join(OUT, 'practice-city-key.json'), 'utf8'));
const prior = kappaOf(base);
const focus = { ...(base.focus || {}) };
for (const v of Object.keys(states)) focus[v] = (focus[v] || 0) + 1;
const faces = { schema: 'agentprivacy.chain-faces/1', faces: [face] };
const folded = { ...base, name: base.name + ' · folded', focus, chains: { root: packets(faces.faces.map(f => f.root)), count: 1 }, prior };
delete folded.kappa; folded.kappa = kappaOf(folded);

fs.writeFileSync(path.join(OUT, 'practice-city-key-folded.json'), JSON.stringify(folded, null, 1) + '\n');
fs.writeFileSync(path.join(OUT, 'practice-chain-faces.json'), JSON.stringify(faces, null, 1) + '\n');
console.log(`${CHAIN}: ${order.length} states [${order.join(', ')}] · face ${face.root} · chains ${folded.chains.root} · κ ${folded.kappa}`);
