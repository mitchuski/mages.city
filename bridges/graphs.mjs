#!/usr/bin/env node
// bridges/graphs.mjs — the City's provenance graphs, exported into the shapes the universe already
// reads: spellweb (the knowledge graph app) and the star chart (Skill Sync's sky). Read-only over
// the Exchange desk (/graph, /catalog), the Hall roster and every resident's journals (forks =
// vouches). Writes bridges/out/{provenance,spellweb.graph,star}.json. Nothing is scored.
//
//   node bridges/graphs.mjs            env: MAGES_TLD · MAGES_FARM_PORT · MAGES_EXCHANGE_PORT · OUT
//
// spellweb vocabulary used (src/types/graph.ts): node types artefact · cast · document; edge types
// forged_by · witnessed_by · anchors_to · relates_to (why: corroborates) · references (why: adopted).
// The Promise graph's `grants` edge is NOT in spellweb's union yet — it is emitted under
// `edges_extension` for the Phase 7 vocabulary pass (the A5 pattern: one union extension).

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TLD = process.env.MAGES_TLD || 'mages.localhost';
const FARM_PORT = Number(process.env.MAGES_FARM_PORT || 3333);
const EX_PORT = Number(process.env.MAGES_EXCHANGE_PORT || 4448);
const defaultOut = () => process.env.OUT || path.join(HERE, 'out');

function get(host, port, p) {
  return new Promise(resolve => {
    const r = http.request({ host: '127.0.0.1', port, path: p, headers: { Host: `${host}:${port}`, Accept: 'application/json' }, timeout: 8000 }, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve(null); } }); });
    r.on('error', () => resolve(null)); r.on('timeout', () => { r.destroy(); resolve(null); }); r.end();
  });
}
const parseRoster = text => { const out = { residents: [], districts: [] }; let cat = ''; for (const raw of String(text).split(/\r?\n/)) { const l = raw.trim(); if (!l) continue; if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(:\d+)?$/.test(l)) { if (cat === 'mages residents') out.residents.push(l); else out.districts.push(l); } else cat = l; } return out; };

export async function build({ out = defaultOut() } = {}) {
  const OUT = out;
  const rosterPage = await get('wiki.' + TLD, FARM_PORT, '/the-roster.json');
  const roster = parseRoster((rosterPage?.story || []).find(i => i.type === 'roster')?.text || '');
  const graph = await get('exchange.' + TLD, EX_PORT, '/graph');
  const catalog = await get('exchange.' + TLD, EX_PORT, '/catalog');
  // forks between residents = vouches
  const forks = [];
  for (const h of [...roster.residents, ...roster.districts]) {
    const sm = await get(h, FARM_PORT, '/system/sitemap.json');
    for (const p of (sm || []).slice(0, 60)) { const pg = await get(h, FARM_PORT, `/${p.slug}.json`); for (const a of pg?.journal || []) if (a.type === 'fork' && a.site) forks.push({ from: h.split('.')[0], to: a.site.split('.')[0], slug: p.slug, date: a.date || 0 }); }
  }
  const provenance = {
    built: new Date().toISOString(), tld: TLD, desk_head: graph?.head || null,
    knowledge: graph?.knowledge || { nodes: [], edges: [] },
    promise: graph?.promise || { nodes: [], edges: [] },
    trust: { nodes: graph?.trust?.nodes || [], edges: [...(graph?.trust?.edges || []), ...forks.map(f => ({ from: 'agent:' + f.from, to: 'agent:' + f.to, type: 'vouched', slug: f.slug, at: new Date(f.date).toISOString() }))] },
    residents: roster.residents.map(h => h.split('.')[0]),
  };
  // spellweb export
  const nodes = new Map(); const edges = []; const ext = [];
  const node = (id, type, label, extra = {}) => { if (!nodes.has(id)) nodes.set(id, { id, type, label, ...extra }); };
  for (const r of provenance.residents) node('cast-' + r, 'cast', r, { site: `${r}.${TLD}` });
  for (const p of catalog?.packets || []) { node('artefact-' + p.name, 'artefact', p.title || p.name, { proof: 'sha256:' + p.hash, kind: p.kind, disclosure: p.disclosure, card: p.card }); node('cast-' + p.by, 'cast', p.by); edges.push({ from: 'artefact-' + p.name, to: 'cast-' + p.by, type: 'forged_by' }); }
  for (const e of provenance.knowledge.edges) { if (e.type === 'anchors_to') { const src = e.to.replace(/^source:/, ''); node('document-' + src, 'document', src); edges.push({ from: e.from.replace(/^packet:/, 'artefact-'), to: 'document-' + src, type: 'anchors_to' }); } if (e.type === 'corroborates') edges.push({ from: e.from.replace(/^packet:/, 'artefact-'), to: e.to.replace(/^packet:/, 'artefact-'), type: 'relates_to', why: 'corroborates', hash: e.hash }); }
  for (const e of provenance.trust.edges) { if (e.type === 'witnessed') edges.push({ from: 'artefact-' + e.packet, to: e.from.replace(/^agent:/, 'cast-'), type: 'witnessed_by', run: e.run }); if (e.type === 'adopted') edges.push({ from: e.from.replace(/^agent:/, 'cast-'), to: 'artefact-' + e.packet, type: 'references', why: 'adopted' }); if (e.type === 'vouched') edges.push({ from: e.from.replace(/^agent:/, 'cast-'), to: e.to.replace(/^agent:/, 'cast-'), type: 'kin_to', why: 'fork', slug: e.slug }); }
  for (const e of provenance.promise.edges) ext.push({ from: e.from.replace(/^agent:/, 'cast-'), to: e.to.replace(/^agent:/, 'cast-'), type: 'grants', packet: e.packet, scope: e.scope, cap: e.cap, expires: e.expires, terms_digest: e.terms_digest, live: e.live });
  const spellweb = { v: 'mages-spellweb-export/0', built: provenance.built, nodes: [...nodes.values()], edges, edges_extension: ext, note: 'edges use the spellweb union; edges_extension needs the Phase 7 vocabulary pass (grants)' };
  // star export (Skill Sync starchart shape)
  const stars = [
    ...(catalog?.packets || []).map(p => ({ name: p.name, title: p.title || p.name, emoji: '📦', kind: 'packet', cat: 'exchange', tier: p.disclosure, card: p.card, hash: p.hash, by: p.by })),
    ...provenance.residents.map(r => ({ name: r, title: r, emoji: '🪪', kind: 'agent', cat: 'residents', tier: '', card: `resident ${r}.${TLD}` })),
  ];
  const sedges = [];
  for (const p of catalog?.packets || []) sedges.push({ a: p.name, b: p.by, w: 3, why: ['forged_by'] });
  for (const e of provenance.trust.edges) { if (e.type === 'witnessed') sedges.push({ a: e.packet, b: e.from.replace(/^agent:/, ''), w: 7, why: ['attested'] }); if (e.type === 'adopted') sedges.push({ a: e.packet, b: e.from.replace(/^agent:/, ''), w: 3, why: ['adopted'] }); if (e.type === 'vouched') sedges.push({ a: e.from.replace(/^agent:/, ''), b: e.to.replace(/^agent:/, ''), w: 5, why: ['fork'] }); if (e.type === 'corroborates') sedges.push({ a: e.from.replace(/^packet:/, ''), b: e.to.replace(/^packet:/, ''), w: 4, why: ['corroborates'] }); }
  const runtimes = provenance.trust.edges.filter(e => e.type === 'witnessed').map(e => ({ member: e.from.replace(/^agent:/, ''), constellation: 'exchange', path: [e.packet], run: e.run, at: e.at }));
  const star = { built: provenance.built, cats: ['exchange', 'residents'], stars, edges: sedges, constellations: [{ name: 'the-exchange', emoji: '📦', purpose: 'packets offered on the Exchange, in order', path: (catalog?.packets || []).map(p => p.name), kind: 'district' }], runtimes, runtimesProof: { head: provenance.desk_head, note: 'the desk ledger head; recompute from /ledger' } };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'provenance.json'), JSON.stringify(provenance, null, 2));
  fs.writeFileSync(path.join(OUT, 'spellweb.graph.json'), JSON.stringify(spellweb, null, 2));
  fs.writeFileSync(path.join(OUT, 'star.json'), JSON.stringify(star, null, 2));
  return { out: OUT, residents: provenance.residents.length, packets: (catalog?.packets || []).length, spellweb: { nodes: spellweb.nodes.length, edges: edges.length, extension: ext.length }, star: { stars: stars.length, edges: sedges.length, runtimes: runtimes.length }, forks: forks.length };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  build().then(r => console.log(JSON.stringify(r, null, 2)));
}
