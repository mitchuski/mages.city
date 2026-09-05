#!/usr/bin/env node
// bridges/community-security/feed.mjs — the secure information-sharing agent feeds the Exchange.
//
// The Community Security Agent (open source, from the Cyber SMART Research Center:
// github.com/smitgu/community-security-agent-public; the keeper runs an instance of it as the
// resident `systerrae`) already does the hard part: its sensitivity gate classifies every
// document PUBLIC | INTERNAL | CONFIDENTIAL, redacts, generalises, and holds INTERNAL / CONFIDENTIAL
// findings for human review. That gate IS the Exchange's render step, and its review state IS the
// human gate. This feeder turns each APPROVED finding into a packet with a provenance record and
// offers it on the Exchange under the instance's resident handle. Thresholds:
//
//   classification   review     → disclosure   card / body
//   PUBLIC           approved   → D4           body = safe_text + IoC lists, public
//   INTERNAL         approved   → D3           card only; body_hash of the safe_text the agent holds
//   CONFIDENTIAL     approved   → D2           card speaks in roles, not names; hash of what the agent holds
//   any              pending    → skipped      humans admit — nothing leaves before review
//
// Terms carry the provenance: attribution (publisher) · source_kind · source_ref (a forum URL, or an
// upload digest — never a filename) · content_hash · classification · scrubber · no_train for anything
// above PUBLIC · expires. Corroboration (the same content hash offered by a distinct holder) shows up
// on the desk's /graph as an edge — weight earned, never configured.
//
//   node feed.mjs --from fixtures/findings.sample.json            # dry-run: print the packets
//   node feed.mjs --from <file> --post                             # offer them on the desk
//   env: EXCHANGE_URL (http://exchange.mages.localhost:4448) · BRIDGE_HANDLE (systerrae) · EXCHANGE_HOST_HEADER
// Reading the agent's database live is a keeper act — export the approved findings to a file first.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';

const sha = s => crypto.createHash('sha256').update(s).digest('hex');
export const THRESHOLDS = { PUBLIC: 'D4', INTERNAL: 'D3', CONFIDENTIAL: 'D2' };
const ROLE_OF = { discourse: 'a forum publisher', upload: 'an uploading organisation' };

export function toPacket(f, exp = {}) {
  if (f.review_status !== 'approved') return { skipped: true, id: f.id, why: `review_status ${f.review_status} — humans admit; nothing leaves before review` };
  const disclosure = THRESHOLDS[f.classification];
  if (!disclosure) return { skipped: true, id: f.id, why: `unknown classification ${f.classification}` };
  const publisher = exp.publisher || 'unknown-publisher';
  const iocs = f.iocs || {};
  const iocText = ['on_chain', 'behavioral', 'gov'].filter(k => (iocs[k] || []).length).map(k => `${k}: ${iocs[k].join('; ')}`).join('\n');
  const held = f.safe_text ? f.safe_text + (iocText ? '\n\n' + iocText : '') : iocText || `[${f.classification} finding ${f.id}: content held by the agent]`;
  const content_hash = f.content_hash || sha(held);
  const source_ref = f.source?.kind === 'upload' ? 'upload:' + sha(String(f.source.ref || '')).slice(0, 12) : String(f.source?.ref || 'unknown');
  const name = `csa-${String(f.id).toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
  const level = f.classification;
  // the card is always public: only a D4 card may quote the safe text; a D3 card names the finding and
  // its incident class, never the held body; a D2 card speaks in roles, not names
  const card = disclosure === 'D2'
    ? `[${level}] ${ROLE_OF[f.source?.kind] || 'a member'} reported: ${(iocs.behavioral || iocs.gov || ['an incident class withheld'])[0]} · entities redacted: ${f.entities_redacted ?? '?'} · held by the sharing agent`.slice(0, 280)
    : disclosure === 'D3'
      ? `[${level}] ${f.name} — ${(iocs.behavioral || iocs.gov || ['details held by the sharing agent'])[0]} · entities redacted: ${f.entities_redacted ?? '?'} · grant to read`.slice(0, 280)
      : `[${level}] ${f.name} — ${(f.safe_text || iocText || '').replace(/\s+/g, ' ').slice(0, 200)}`.slice(0, 280);
  const terms = {
    attribution: publisher,
    source_kind: f.source?.kind || 'unknown',
    source_ref,
    content_hash,
    classification: level,
    scrubber: 'sensitivity_gate/regex+ner',
    entities_redacted: String(f.entities_redacted ?? 0),
    no_train: level !== 'PUBLIC',
    expires: exp.expires || new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
  };
  const packet = { name, kind: 'doc', title: disclosure === 'D2' ? `${level} finding ${f.id}` : f.name, card, disclosure, terms };
  if (disclosure === 'D4') packet.body = held; else packet.body_hash = content_hash;
  return { packet, provenance: { finding: f.id, classification: level, review: f.review_status, source: { kind: f.source?.kind, ref: source_ref, fetched_at: f.source?.fetched_at }, content_hash } };
}

export function feed(exportJson) {
  const out = { offered: [], skipped: [] };
  for (const f of exportJson.findings || []) { const r = toPacket(f, exportJson); (r.skipped ? out.skipped : out.offered).push(r); }
  return out;
}

function post(url, body, hostHeader) {
  return new Promise(resolve => {
    const u = new URL(url); const data = Buffer.from(JSON.stringify(body));
    const r = http.request({ host: hostHeader ? '127.0.0.1' : u.hostname, port: Number(u.port || 80), path: u.pathname, method: 'POST', headers: { Host: u.host, 'Content-Type': 'application/json', 'Content-Length': data.length }, timeout: 8000 }, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch {} resolve({ status: res.statusCode, json: j }); }); });
    r.on('error', e => resolve({ status: 0, json: { error: String(e) } })); r.on('timeout', () => { r.destroy(); resolve({ status: 0, json: { error: 'timeout' } }); });
    r.write(data); r.end();
  });
}

export async function offerAll(exportJson, { url, handle, hostHeader = true } = {}) {
  const res = feed(exportJson); const results = [];
  for (const o of res.offered) {
    const r = await post(`${url}/offer`, { handle, packet: o.packet }, hostHeader);
    results.push({ name: o.packet.name, disclosure: o.packet.disclosure, status: r.status, ok: !!r.json?.ok, note: r.status === 409 ? 'already offered' : r.json?.error || null, page: r.json?.page });
  }
  return { ...res, results };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args = process.argv.slice(2);
  const flag = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const from = flag('--from') || path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'findings.sample.json');
  const exp = JSON.parse(fs.readFileSync(from, 'utf8'));
  if (args.includes('--post')) {
    const r = await offerAll(exp, { url: process.env.EXCHANGE_URL || 'http://exchange.mages.localhost:4448', handle: process.env.BRIDGE_HANDLE || 'systerrae', hostHeader: process.env.EXCHANGE_HOST_HEADER !== '0' });
    console.log(JSON.stringify({ offered: r.results, skipped: r.skipped }, null, 2));
  } else {
    const r = feed(exp);
    console.log(JSON.stringify({ dry_run: true, offered: r.offered.map(o => ({ ...o.packet, body: o.packet.body ? o.packet.body.slice(0, 80) + '…' : undefined })), skipped: r.skipped }, null, 2));
  }
}
