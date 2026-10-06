#!/usr/bin/env node
// bin/launch-reader.mjs — a local review reader for the pending blog drafts. Zero dependencies.
//
//   node bin/launch-reader.mjs             build .run/reader/ (shelf + one page per draft; open index.html as a file)
//   node bin/launch-reader.mjs --serve     build, then serve on 127.0.0.1:8793 and record review notes
//   node bin/launch-reader.mjs --no-probe  skip the live probes (offline build)      --port=NNNN
//
// Drafts: the mages.city launch post (this repo) and the pending posts in ~/agentprivacy-docs/blog,
// including "The City Begins to Connect" with its six browser captures. Each page renders the
// draft with a section nav, the screenshots inline with their capture provenance, the editor
// notes where a companion file exists, and a "before publishing" panel whose rows are MEASURED
// at build time (live front, skill.md, roster, capture URLs, image files, series number), not
// remembered. Review notes and rulings autosave to .run/reader/review.json (gitignored) when
// served; as plain files they fall back to the browser's localStorage.
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = path.dirname(ROOT);
const OUT_DIR = path.join(ROOT, '.run', 'reader');
const NOTES = path.join(OUT_DIR, 'review.json');
const NOTES_LOG = path.join(OUT_DIR, 'review.log.jsonl');
const SERIES_DIR = path.join(HOME, 'cityofmages', 'blog');
const DOCS_BLOG = path.join(HOME, 'agentprivacy-docs', 'blog');
const args = process.argv.slice(2);
const SERVE = args.includes('--serve');
const PROBE = !args.includes('--no-probe');
const PORT = Number((args.find(a => /^--port=/.test(a)) || '').split('=')[1] || 8793);

const DRAFTS = [
  { slug: 'mages-city-first-light', src: path.join(ROOT, 'docs', 'LAUNCH_2026-09-05.md'), repo: 'mages_city', kind: 'launch' },
  { slug: 'the-city-begins-to-connect', src: path.join(DOCS_BLOG, 'the-city-begins-to-connect.md'), notes: path.join(DOCS_BLOG, 'the-city-begins-to-connect.editor-notes.md'), captures: path.join(DOCS_BLOG, 'images', 'the-city-begins-to-connect', 'index.html'), repo: 'agentprivacy-docs' },
  { slug: 'the-oracle-and-the-gate', src: path.join(DOCS_BLOG, 'the-oracle-and-the-gate.md'), repo: 'agentprivacy-docs' },
  { slug: 'trust-tasks-at-the-gate', src: path.join(DOCS_BLOG, 'trust-tasks-at-the-gate.md'), repo: 'agentprivacy-docs' },
  { slug: 'the-dual-agent-harness', src: path.join(DOCS_BLOG, 'the-dual-agent-harness.md'), repo: 'agentprivacy-docs' },
  { slug: 'founding-the-city-of-mages', src: path.join(DOCS_BLOG, 'founding-the-city-of-mages.md'), repo: 'agentprivacy-docs' },
].filter(d => fs.existsSync(d.src));

// ---------- markdown (just enough for these drafts) ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = s => s.toLowerCase().replace(/[`*_]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const rel = p => path.relative(HOME, p).replace(/\\/g, '/');
const countWords = s => (s.match(/[A-Za-z0-9’']+/g) || []).length;
function inline(s) {
  const codes = [];
  s = esc(s).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?=[^*\w]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}
function parseFrontmatter(text) {
  // the docs drafts carry CRLF and even CR CR LF line ends, plus the odd BOM; normalise before parsing
  text = text.replace(/^﻿/, '').replace(/\r+\n/g, '\n').replace(/\r/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const k = line.match(/^([\w-]+):\s*(.*)$/); if (!k) continue;
    meta[k[1]] = k[2].replace(/^"(.*)"$/, '$1');
  }
  return { meta, body: text.slice(m[0].length) };
}
// figures: called for every ![alt](src); returns the HTML to emit
function render(body, { title = '', figure = null, sections = true } = {}) {
  const lines = body.split(/\r?\n/);
  const out = [], toc = [], words = {}, figures = [];
  let i = 0, poem = false, section = null;
  const addWords = n => { const k = section || '_intro'; words[k] = (words[k] || 0) + n; };
  const closeSection = () => { if (section && sections) out.push('</section>'); };
  const BLOCK = /^(#{1,4}\s|---+\s*$|```|\||[-*]\s|\d+\.\s|>|!\[)/;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*$/.test(l)) { i++; continue; }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length, text = h[2].trim(), id = slugify(text);
      i++;
      if (level === 1 && text.toLowerCase() === title.toLowerCase()) continue; // the masthead already shows it
      if (level === 2 && sections) { closeSection(); section = id; poem = /poem/i.test(text); out.push(`<section id="${id}" class="part${poem ? ' poem' : ''}">`); }
      toc.push({ level, id, text });
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`); continue;
    }
    if (/^---+\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (/^```/.test(l)) {
      const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++; out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`); continue;
    }
    const img = l.match(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/);
    if (img) { i++; figures.push({ alt: img[1], src: img[2] }); out.push(figure ? figure(img[1], img[2]) : `<figure><img src="${esc(img[2])}" alt="${esc(img[1])}"><figcaption>${inline(img[1])}</figcaption></figure>`); continue; }
    if (/^\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(rows[0]); const bodyRows = rows.slice(2).map(cells);
      let t = '<div class="tablewrap"><table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
      for (const r of bodyRows) t += '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>';
      out.push(t + '</tbody></table></div>'); addWords(countWords(rows.join(' '))); continue;
    }
    const listRe = /^([-*]|\d+\.)\s+/;
    if (listRe.test(l)) {
      const ordered = /^\d+\./.test(l); const items = [];
      while (i < lines.length && listRe.test(lines[i])) {
        let item = lines[i++].replace(listRe, '');
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !listRe.test(lines[i].trim())) item += ' ' + lines[i++].trim();
        items.push(item);
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>` + items.map(x => `<li>${inline(x)}</li>`).join('') + `</${tag}>`); addWords(countWords(items.join(' '))); continue;
    }
    if (/^>\s?/.test(l)) {
      const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      const paras = buf.join('\n').split(/\n\s*\n/).map(p => `<p>${inline(p.replace(/\n/g, ' '))}</p>`).join('');
      out.push(`<blockquote>${paras}</blockquote>`); addWords(countWords(buf.join(' '))); continue;
    }
    const buf = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !BLOCK.test(lines[i])) buf.push(lines[i++]);
    if (!buf.length) { i++; continue; }
    addWords(countWords(buf.join(' ')));
    if (poem) out.push(`<p class="stanza">${buf.map(inline).join('<br>')}</p>`);
    else {
      const text = buf.join(' ');
      out.push(/^`[^`]+`$/.test(text.trim()) ? `<p class="motto">${inline(text)}</p>` : `<p>${inline(text)}</p>`);
    }
  }
  closeSection();
  return { html: out.join('\n'), toc, words, figures, total: Object.values(words).reduce((a, b) => a + b, 0) };
}

// ---------- measured checks ----------
async function get(url, ms = 12000, method = 'GET') {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(url, { signal: ac.signal, redirect: 'follow', method }); const body = method === 'GET' ? await r.text() : ''; return { status: r.status, body }; }
  catch (e) { return { status: 0, body: '', error: e.name === 'AbortError' ? 'timeout' : String(e.message) }; }
  finally { clearTimeout(t); }
}
const mk = (state, claim, measured, note) => ({ state, claim, measured, note });

async function launchChecks(meta) {
  const checks = [];
  if (PROBE) {
    const front = await get('https://mages.city/');
    const title = (front.body.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    const localTitle = ((fs.readFileSync(path.join(ROOT, 'site', 'index.html'), 'utf8').match(/<title>([^<]*)<\/title>/) || [])[1] || '').trim();
    const ownByte = front.status === 200 && title.trim() === localTitle;
    checks.push(mk(ownByte ? 'ok' : 'fail', '"Today the front of mages.city went live"',
      front.status ? `HTTP ${front.status} · live title "${title}" · repo title "${localTitle}" · ${front.body.length} bytes` : `unreachable (${front.error})`,
      ownByte ? 'A byte of our own page came back, so the front is live. "Today" is the draft\'s date, 2026-09-05; the draft file has not changed since, and the front has.' : 'Do not publish: the page did not answer with our own content.'));
    const nav = [...front.body.matchAll(/class="links">([\s\S]*?)<\/div>/g)].map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).join(' | ');
    checks.push(mk(/feed|board/i.test(front.body) && /resident/i.test(front.body) ? 'ok' : 'warn',
      '"a feed, a board, two residents, a file called skill.md" describes the front', `index nav: ${nav || 'not found'}`,
      `The live index is the City Spellbook; the feed/board/residents front moved to /connected/ (commit 327ff42)${fs.existsSync(path.join(ROOT, 'parked', 'connected')) ? ' and the working tree is now parking it (site/connected → parked/connected, uncommitted)' : ''}. The post should describe the front a reader will actually see.`));
    const skill = await get('https://mages.city/skill.md');
    checks.push(mk(skill.status === 200 ? 'ok' : 'fail', '"read mages.city/skill.md"', skill.status === 200 ? `HTTP 200 · ${skill.body.length} bytes` : `HTTP ${skill.status}`,
      'The live skill.md headings are 0 Read · 1 Speak · 2 Apply at the gate · 3 Claim your site · 4 Write. The post says read → speak → sponsor → qualify → receive → work. Same path, different words; decide which vocabulary is canon.'));
    // residents come from the Hall wiki's roster page (the connected front's data.js roster()); try public, then tailnet, then the local twin.
    // The module is being moved by another lane (site/connected → parked/connected), so look in both places.
    let parseRoster = null;
    for (const cand of ['site/connected/data.js', 'parked/connected/data.js']) {
      if (fs.existsSync(path.join(ROOT, cand))) { try { ({ parseRoster } = await import(`../${cand}`)); break; } catch { /* try the next */ } }
    }
    if (!parseRoster) parseRoster = text => ({ categories: { 'mages residents': [...text.matchAll(/^\s*([\w-]+)\s*$/gm)].map(m => ({ name: m[1] })) }, all: [] });
    const sources = [['public', 'https://wiki.mages.city/the-roster.json'], ['tailnet mitch-pi:3341', 'http://mitch-pi:3341/the-roster.json'], ['local twin', 'http://wiki.mages.localhost:3333/the-roster.json']];
    let roster = null; const tried = [];
    for (const [label, url] of sources) {
      const r = await get(url, 6000); tried.push(`${label} ${r.status || r.error}`);
      if (r.status !== 200) continue;
      try { const item = (JSON.parse(r.body).story || []).find(i => i.type === 'roster'); const parsed = parseRoster(item?.text || ''); roster = { label, residents: parsed.categories['mages residents'] || [] }; break; } catch { /* not a roster */ }
    }
    const publicHall = tried[0].endsWith('200');
    checks.push(mk(roster ? (roster.residents.length === 2 ? (publicHall ? 'ok' : 'warn') : 'warn') : 'warn', '"Two residents. One swarm, not yet."',
      roster ? `${roster.residents.length} residents on the roster (${roster.label}): ${roster.residents.map(x => x.name || x.host || x.slug || JSON.stringify(x)).join(', ')} · tried: ${tried.join(' → ')}` : `no roster reachable · tried: ${tried.join(' → ')}`,
      publicHall ? (roster && roster.residents.length === 2 ? 'Matches.' : 'Recount before publishing.') : 'The Hall (wiki.mages.city) does not resolve publicly, so /connected/ shows a public reader no residents at all; the count in the post is only checkable from inside. Decide whether "two residents" can stand on a page the reader cannot see.'));
  } else checks.push(mk('skip', 'live front, skill.md, residents', 'not probed (--no-probe)', 'Run without --no-probe to measure.'));
  for (const r of (meta.companion || '').match(/docs\/[\w./-]+\.md/g) || []) {
    const ok = fs.existsSync(path.join(ROOT, r));
    checks.push(mk(ok ? 'ok' : 'fail', `companion ${r}`, ok ? 'exists' : 'missing', ok ? 'Named in the frontmatter; present in the repo.' : 'Named in the frontmatter but absent.'));
  }
  if (fs.existsSync(SERIES_DIR)) {
    const nums = fs.readdirSync(SERIES_DIR).map(f => (f.match(/^blog-post-(\d+)-/) || [])[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
    const max = nums.length ? nums[nums.length - 1] : 0; const gaps = []; for (let n = 1; n <= max; n++) if (!nums.includes(n)) gaps.push(n);
    checks.push(mk('warn', 'destination: cityofmages/blog "next number in the series"', `series has ${nums.length} posts, highest ${max}, missing ${gaps.length ? gaps.join(', ') : 'none'}`,
      `Next number is ${max + 1} unless the gap is meant to be filled. Post ${max} carries series/post_number/publication fields this draft lacks.`));
  }
  checks.push(mk('warn', 'Section III · "did." in the farm hosts row', 'docs/RUNBOOK.md §B2 says upstream\'s host is `dids.` (plural)', 'Fix the table row `vta.` `vtc.` `mediator.` `did.` → `dids.`; the runbook records that earlier drafts got this wrong.'));
  checks.push(mk('warn', '"as the farm comes up, a trust agent" · "a trust agent per admitted agent"', 'docs/VTAFARM.md §3 + docs/RUNBOOK.md: the City is a community operator, not a farm operator; `issue` records the persona DID the agent already holds',
    'Ruled after this draft was written (2026-09-07). If the ruling stands, the post should stop promising a City-issued trust agent and say the City records the one an agent brings.'));
  checks.push(mk('info', 'license CC BY-SA 4.0', 'series post 18 also says CC BY-SA 4.0; the 2026-09-13 licensing pass set repo docs to CC BY 4.0', 'Blog posts have their own licence line; confirm which applies here.'));
  return checks;
}

// the capture folder's index.html records where each screenshot came from (deployed vs local) and the global caveat
function readCaptures(file) {
  if (!file || !fs.existsSync(file)) return null;
  const h = fs.readFileSync(file, 'utf8');
  const strip = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const caveat = strip((h.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || '');
  const map = {};
  for (const m of h.matchAll(/<figure>[\s\S]*?<img src="([^"]+)"[\s\S]*?<figcaption>([\s\S]*?)<\/figcaption>/g)) {
    const url = (m[2].match(/href="([^"]+)"/) || [])[1] || null;
    map[path.basename(m[1])] = { text: strip(m[2]), url, local: /local/i.test(m[2]) };
  }
  return { caveat, map };
}
async function genericChecks(d, meta, body, figures, captures) {
  const checks = [];
  const state = meta.status || meta.version || '';
  if (state) checks.push(mk(/publish|live/i.test(state) && !/not published|unsigned|draft/i.test(state) ? 'ok' : 'info', 'frontmatter state', state, 'What the file says about itself.'));
  const placeholders = (body.match(/\bIMAGE\b[^\n]{0,40}/g) || []);
  if (placeholders.length) checks.push(mk('warn', 'IMAGE placeholders left in the draft', placeholders.slice(0, 3).join(' · '), 'The editor notes ask for every placeholder to be replaced with a chosen screenshot.'));
  for (const f of figures) {
    const file = path.resolve(path.dirname(d.src), f.src); const ok = fs.existsSync(file);
    const cap = captures?.map[path.basename(f.src)];
    let liveNote = '';
    if (ok && cap?.url && !cap.local && PROBE) { const r = await get(cap.url, 10000, 'HEAD'); liveNote = ` · captured page now answers HTTP ${r.status || r.error}`; }
    checks.push(mk(!ok ? 'fail' : (cap && /defect/i.test(cap.text)) ? 'warn' : cap?.local ? 'info' : 'ok', `figure ${path.basename(f.src)}`,
      (ok ? `${(fs.statSync(file).size / 1024).toFixed(0)} KB` : 'file missing') + (cap ? ` · ${cap.text}` : ' · no capture record') + liveNote,
      !ok ? 'The draft embeds an image that is not on disk.' : cap && /defect/i.test(cap.text) ? 'The capture page says this shot shows defects; recapture before publishing.' : cap?.local ? 'A local preview, not a deployed page; say so in the caption or recapture from the live site.' : `Caption in the draft: "${f.alt}".`));
  }
  if (captures?.caveat) checks.push(mk('info', 'capture page caveat', captures.caveat, `From ${rel(d.captures)}.`));
  if (d.notes) checks.push(mk(fs.existsSync(d.notes) ? 'info' : 'warn', 'editor notes', fs.existsSync(d.notes) ? `${rel(d.notes)} · rendered below the checks` : 'missing', 'The editorial handoff that came with the draft.'));
  return checks;
}

// ---------- pages ----------
const CSS = `
:root{--ink:#141a3d;--paper:#f0eee8;--accent:#e8523a;--sky:#4dd9e8;--mute:#6b6f85;--line:#d9d5cb;--card:#ffffff;
  --serif:"IBM Plex Serif",Georgia,"Times New Roman",serif;--sans:"IBM Plex Sans","Segoe UI",system-ui,sans-serif;--mono:"IBM Plex Mono",Consolas,"Courier New",monospace}
@media (prefers-color-scheme:dark){:root{--ink:#e9e7df;--paper:#12162e;--card:#1a2040;--line:#2c3358;--mute:#9aa0bb}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--serif);font-size:17px;line-height:1.6}
a{color:inherit}
.frame{display:grid;grid-template-columns:240px minmax(0,1fr) 340px;gap:32px;max-width:1380px;margin:0 auto;padding:24px 20px 80px}
@media (max-width:1100px){.frame{grid-template-columns:220px minmax(0,1fr)}.side{grid-column:1/-1}}
@media (max-width:760px){.frame{grid-template-columns:1fr;padding:16px}.nav{position:static}}
.nav{position:sticky;top:16px;align-self:start;font-family:var(--sans);font-size:13px;max-height:calc(100vh - 32px);overflow:auto}
.nav .brand{font-weight:600;letter-spacing:.02em;color:var(--mute);text-transform:uppercase;font-size:11px;margin-bottom:10px}
.nav .brand a{text-decoration:none}
.nav a.t{display:block;color:var(--ink);text-decoration:none;padding:4px 8px;border-left:2px solid transparent;border-radius:0 4px 4px 0}
.nav a.t:hover{background:var(--card)}.nav a.lvl3{padding-left:20px;color:var(--mute)}.nav a.lvl4{padding-left:32px;color:var(--mute);font-size:12px}
.nav .wc{float:right;color:var(--mute);font-family:var(--mono);font-size:11px}
.nav .stat{margin-top:14px;padding-top:10px;border-top:1px solid var(--line);color:var(--mute);font-size:12px;line-height:1.5}
.nav .stat code{font-size:11px}
main{min-width:0}
.mast{border-bottom:1px solid var(--line);padding-bottom:20px;margin-bottom:28px}
.mast .kicker{font-family:var(--sans);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.mast h1{font-size:34px;line-height:1.15;margin:0 0 10px;font-weight:600}
.mast .sub{font-size:19px;color:var(--mute);font-style:italic;margin:0 0 18px}
.mrow{display:grid;grid-template-columns:120px 1fr;gap:10px;font-family:var(--sans);font-size:13px;padding:3px 0}
.mk{color:var(--mute);text-transform:uppercase;letter-spacing:.05em;font-size:11px;padding-top:2px}
.mv code{font-size:12px}
article{max-width:720px}
article h2{font-family:var(--sans);font-size:14px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin:48px 0 8px;padding-top:24px;border-top:1px solid var(--line)}
article h3{font-size:26px;margin:8px 0 18px;font-weight:600;line-height:1.2}
article h4{font-family:var(--sans);font-size:15px;margin:28px 0 8px;font-weight:600}
article p{margin:0 0 18px}article hr{border:0;border-top:1px solid var(--line);margin:32px 0}
article .motto{font-family:var(--mono);font-size:14px;color:var(--mute);text-align:center}
article .stanza{margin:0 0 22px;font-size:18px;line-height:1.55}
article code{font-family:var(--mono);font-size:.88em;background:var(--card);padding:1px 5px;border-radius:3px;border:1px solid var(--line)}
article pre{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:14px 16px;overflow:auto;font-size:13.5px;line-height:1.55}
article pre code{background:none;border:0;padding:0}
figure{margin:28px 0 30px}figure img{display:block;width:100%;max-width:100%;border:1px solid var(--line);border-radius:6px;background:#080e19}
figcaption{font-family:var(--sans);font-size:13px;color:var(--mute);margin-top:8px;line-height:1.45}
figcaption .prov{display:block;font-size:11.5px;margin-top:3px}figcaption .prov.local{color:var(--accent)}
.tablewrap{overflow-x:auto;margin:0 0 20px}
table{border-collapse:collapse;width:100%;font-family:var(--sans);font-size:14px}
th,td{text-align:left;vertical-align:top;padding:8px 10px;border-bottom:1px solid var(--line)}th{font-weight:600;color:var(--mute);font-size:12px;text-transform:uppercase;letter-spacing:.04em}
ul,ol{padding-left:22px}li{margin-bottom:6px}
blockquote{margin:0 0 18px;padding-left:16px;border-left:3px solid var(--sky);color:var(--mute)}
.side{align-self:start;position:sticky;top:16px;font-family:var(--sans);font-size:13px;max-height:calc(100vh - 32px);overflow:auto}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin-bottom:14px}
.card h5{margin:0 0 10px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
ol.checks{list-style:none;margin:0;padding:0}
.chk{display:grid;grid-template-columns:18px 1fr;gap:10px;padding:8px 0;border-top:1px solid var(--line)}.chk:first-child{border-top:0}
.chk .g{font-weight:700;font-family:var(--mono)}.chk.ok .g{color:#2f9e5a}.chk.warn .g{color:var(--accent)}.chk.fail .g{color:#c0392b}.chk.info .g,.chk.skip .g{color:var(--mute)}
.chk .claim{font-weight:600}.chk .meas{font-family:var(--mono);font-size:11.5px;color:var(--mute);margin:3px 0;word-break:break-word}.chk .note{color:var(--ink);opacity:.85;font-size:12.5px}
.chk code{font-size:11px}
details.notes summary{cursor:pointer;font-weight:600}
details.notes .body{font-family:var(--serif);font-size:14px;line-height:1.5;margin-top:10px}
details.notes .body h1,details.notes .body h2{font-family:var(--sans);font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--mute);margin:16px 0 6px}
details.notes .body p{margin:0 0 10px}
.nb{display:block;margin-bottom:10px}.nb span{display:block;font-size:11px;color:var(--mute);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
textarea{width:100%;font:13px/1.45 var(--sans);color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:8px;resize:vertical}
.verdict{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.verdict label{border:1px solid var(--line);border-radius:999px;padding:4px 10px;cursor:pointer}
.verdict input{margin-right:5px}
.verdict label:has(input:checked){border-color:var(--accent);background:var(--paper)}
.save{display:flex;align-items:center;gap:10px}
button{font:600 13px var(--sans);background:var(--ink);color:var(--paper);border:0;border-radius:6px;padding:8px 14px;cursor:pointer}
#status{color:var(--mute);font-size:12px}
.foot{margin-top:60px;color:var(--mute);font-family:var(--sans);font-size:12px;border-top:1px solid var(--line);padding-top:12px}
/* shelf */
.shelf{max-width:960px;margin:0 auto;padding:40px 20px 80px}
.shelf h1{font-size:30px;margin:0 0 6px}.shelf .lede{color:var(--mute);font-family:var(--sans);font-size:14px;margin:0 0 28px}
.draft{display:grid;grid-template-columns:1fr auto;gap:18px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin-bottom:14px;text-decoration:none;color:inherit}
.draft:hover{border-color:var(--accent)}
.draft h2{font-size:21px;margin:0 0 4px;font-weight:600}.draft .sub{color:var(--mute);font-style:italic;margin:0 0 8px}
.draft .meta{font-family:var(--sans);font-size:12px;color:var(--mute);line-height:1.6}.draft .meta code{font-size:11px}
.draft .right{font-family:var(--sans);font-size:12px;text-align:right;color:var(--mute);white-space:nowrap}
.pill{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:2px 9px;font-size:11px;margin-left:4px}
.pill.v{border-color:var(--accent);color:var(--accent)}.pill.k{border-color:#2f9e5a;color:#2f9e5a}
@media (max-width:640px){.draft{grid-template-columns:1fr}.draft .right{text-align:left;white-space:normal}}
`;
const GLYPH = { ok: '✓', warn: '△', fail: '✗', info: '·', skip: '–' };
const NOTES_JS = (slug) => `
(function(){
  const slug=${JSON.stringify(slug)}, served=location.protocol.startsWith('http'), KEY='blog-review:'+slug;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], status=$('#status');
  function collect(){const notes={};$$('textarea[data-key]').forEach(t=>{if(t.value.trim())notes[t.dataset.key]=t.value});const v=$('input[name=verdict]:checked');return{slug,verdict:v?v.value:null,notes}}
  function fill(d){if(!d)return;$$('textarea[data-key]').forEach(t=>{t.value=(d.notes||{})[t.dataset.key]||''});if(d.verdict){const r=$('input[name=verdict][value="'+d.verdict+'"]');if(r)r.checked=true}status.textContent='loaded '+(d.at?new Date(d.at).toLocaleString():'')}
  async function load(){try{if(served){const r=await fetch('/notes');if(r.ok){const all=await r.json();fill((all.drafts||{})[slug])}}else fill(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(e){}}
  let timer=null;
  async function save(){const d=collect();d.at=new Date().toISOString();try{if(served){const r=await fetch('/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});const j=await r.json();status.textContent=j.ok?'saved to .run/reader/review.json · '+new Date(j.at).toLocaleTimeString():'save failed: '+j.error}else{localStorage.setItem(KEY,JSON.stringify(d));status.textContent='saved in this browser only (serve with --serve to write to the repo)'}}catch(e){status.textContent='save failed: '+e.message}}
  $('#save').addEventListener('click',save);
  $$('textarea[data-key],input[name=verdict]').forEach(el=>el.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(save,900)}));
  load();
})();`;

function draftPage(d, meta, r, checks, notesHtml, builtAt) {
  const navItems = r.toc.filter(t => t.level >= 2).map(t => `<a class="t lvl${t.level}" href="#${t.id}">${esc(t.text)}${t.level === 2 && r.words[t.id] ? `<span class="wc">${r.words[t.id]}w</span>` : ''}</a>`).join('');
  const metaRows = Object.keys(meta).filter(k => !['title', 'subtitle'].includes(k))
    .map(k => `<div class="mrow"><span class="mk">${esc(k.replace(/_/g, ' '))}</span><span class="mv">${inline(meta[k])}</span></div>`).join('');
  const checkRows = checks.map(c => `<li class="chk ${c.state}"><span class="g">${GLYPH[c.state]}</span><div><div class="claim">${inline(c.claim)}</div><div class="meas">${inline(c.measured)}</div><div class="note">${inline(c.note)}</div></div></li>`).join('');
  const noteBoxes = r.toc.filter(t => t.level === 2).map(t => `<label class="nb"><span>${esc(t.text)}</span><textarea data-key="${t.id}" rows="2" placeholder="notes on this part…"></textarea></label>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reader · ${esc(meta.title || d.slug)}</title><style>${CSS}</style></head><body>
<div class="frame">
<nav class="nav"><div class="brand"><a href="index.html">🧙 pending blogs</a> · reader</div>${navItems}
<div class="stat">${r.total} words · ~${Math.max(1, Math.round(r.total / 220))} min${r.figures.length ? ` · ${r.figures.length} figures` : ''}<br>source <code>${esc(rel(d.src))}</code><br>built ${esc(builtAt)}<br><a href="#review">↓ before publishing</a></div></nav>
<main>
<header class="mast"><div class="kicker">${esc(meta.status || meta.version || 'draft')}</div>
<h1>${inline(meta.title || d.slug)}</h1>
${meta.subtitle ? `<p class="sub">${inline(meta.subtitle)}</p>` : ''}
${metaRows}</header>
<article>
${r.html}
</article>
<div class="foot">Rendered from <code>${esc(rel(d.src))}</code> by <code>mages_city/bin/launch-reader.mjs</code>. The file is the source; edit it and rebuild.</div>
</main>
<aside class="side" id="review">
<div class="card"><h5>Before publishing · measured at build</h5><ol class="checks">${checkRows}</ol></div>
${notesHtml ? `<div class="card"><details class="notes"><summary>Editor notes (the handoff that came with the draft)</summary><div class="body">${notesHtml}</div></details></div>` : ''}
<div class="card"><h5>Your ruling</h5>
<div class="verdict">
<label><input type="radio" name="verdict" value="publish">publish as is</label>
<label><input type="radio" name="verdict" value="edit">publish after edits</label>
<label><input type="radio" name="verdict" value="hold">hold</label>
<label><input type="radio" name="verdict" value="rewrite">rewrite</label>
</div>
${noteBoxes}
<label class="nb"><span>general</span><textarea data-key="general" rows="4" placeholder="the ruling, in your words…"></textarea></label>
<div class="save"><button id="save">Save notes</button><span id="status"></span></div>
</div>
</aside>
</div>
<script>${NOTES_JS(d.slug)}</script>
</body></html>`;
}

function shelfPage(rows, builtAt) {
  const items = rows.map(x => `<a class="draft" href="${x.slug}.html" data-slug="${x.slug}">
<div><h2>${inline(x.title)}</h2>${x.subtitle ? `<p class="sub">${inline(x.subtitle)}</p>` : ''}
<div class="meta">${esc(x.state)}<br>${x.pub ? esc(x.pub) + ' · ' : ''}<code>${esc(x.src)}</code></div></div>
<div class="right">${x.total} words · ~${Math.max(1, Math.round(x.total / 220))} min${x.figures ? `<br>${x.figures} figures` : ''}<br>${x.counts.warn ? `<span class="pill">△ ${x.counts.warn}</span>` : ''}${x.counts.fail ? `<span class="pill v">✗ ${x.counts.fail}</span>` : ''}${x.counts.ok ? `<span class="pill k">✓ ${x.counts.ok}</span>` : ''}<span class="pill verdict" hidden></span></div></a>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pending blogs · reader</title><style>${CSS}</style></head><body>
<div class="shelf"><h1>🧙 Pending blogs</h1><p class="lede">${rows.length} drafts, read from their own files. Each page renders the draft with its screenshots and a "before publishing" panel measured at build (${esc(builtAt)}). Rulings and notes save to <code>mages_city/.run/reader/review.json</code>.</p>
${items}
<div class="foot">Rebuild: <code>node bin/launch-reader.mjs --serve</code> from <code>~/mages_city</code>.</div></div>
<script>
(async()=>{try{if(!location.protocol.startsWith('http'))return;const r=await fetch('/notes');if(!r.ok)return;const all=(await r.json()).drafts||{};document.querySelectorAll('.draft').forEach(a=>{const d=all[a.dataset.slug];if(d&&d.verdict){const p=a.querySelector('.pill.verdict');p.textContent='ruling: '+d.verdict;p.hidden=false}})}catch(e){}})();
</script></body></html>`;
}

// ---------- build ----------
async function build() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const builtAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + 'Z';
  const rows = [];
  for (const d of DRAFTS) {
    const { meta, body } = parseFrontmatter(fs.readFileSync(d.src, 'utf8'));
    const captures = readCaptures(d.captures);
    const assetDir = path.join(OUT_DIR, 'assets', d.slug);
    const figure = (alt, src) => {
      const file = path.resolve(path.dirname(d.src), src); const base = path.basename(src);
      if (fs.existsSync(file)) { fs.mkdirSync(assetDir, { recursive: true }); fs.copyFileSync(file, path.join(assetDir, base)); }
      const cap = captures?.map[base];
      const prov = cap ? `<span class="prov${cap.local ? ' local' : ''}">capture: ${esc(cap.text)}</span>` : '';
      return `<figure><img src="assets/${d.slug}/${esc(base)}" alt="${esc(alt)}" loading="lazy"><figcaption>${inline(alt)}${prov}</figcaption></figure>`;
    };
    const r = render(body, { title: meta.title || '', figure });
    const checks = d.kind === 'launch' ? await launchChecks(meta) : await genericChecks(d, meta, body, r.figures, captures);
    const notesHtml = d.notes && fs.existsSync(d.notes) ? render(parseFrontmatter(fs.readFileSync(d.notes, 'utf8')).body, { sections: false }).html : '';
    fs.writeFileSync(path.join(OUT_DIR, d.slug + '.html'), draftPage(d, meta, r, checks, notesHtml, builtAt));
    const counts = { ok: 0, warn: 0, fail: 0 }; for (const c of checks) if (c.state in counts) counts[c.state]++;
    rows.push({ slug: d.slug, title: meta.title || d.slug, subtitle: meta.subtitle || '', state: meta.status || meta.version || 'draft', pub: [meta.publication, meta.series, meta.date].filter(Boolean).join(' · '), src: rel(d.src), total: r.total, figures: r.figures.length, counts });
    console.log(`${d.slug}.html  ${r.total}w · ${r.figures.length} fig · checks ${counts.ok} ok / ${counts.warn} warn / ${counts.fail} fail`);
    for (const c of checks) console.log(`   ${GLYPH[c.state]} ${c.claim} — ${c.measured}`);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), shelfPage(rows, builtAt));
  console.log(`built ${rel(OUT_DIR)}/index.html (${rows.length} drafts)`);
}

await build();
if (SERVE) {
  const TYPES = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };
  const readNotes = () => { try { return JSON.parse(fs.readFileSync(NOTES, 'utf8')); } catch { return { drafts: {} }; } };
  http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/notes' && req.method === 'POST') {
      let b = ''; req.on('data', c => { b += c; if (b.length > 262144) req.destroy(); });
      req.on('end', () => {
        try {
          const j = JSON.parse(b); if (!j.slug || !DRAFTS.some(d => d.slug === j.slug)) throw new Error('unknown draft');
          const all = readNotes(); all.drafts = all.drafts || {};
          const rec = { at: new Date().toISOString(), verdict: j.verdict || null, notes: j.notes || {} };
          all.drafts[j.slug] = rec;
          fs.writeFileSync(NOTES, JSON.stringify(all, null, 2) + '\n'); fs.appendFileSync(NOTES_LOG, JSON.stringify({ slug: j.slug, ...rec }) + '\n');
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, at: rec.at }));
        } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: String(e.message) })); }
      });
      return;
    }
    if (url.pathname === '/notes') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(readNotes())); }
    const src = url.pathname.match(/^\/source\/([\w-]+)\.md$/);
    if (src) { const d = DRAFTS.find(x => x.slug === src[1]); if (!d) { res.writeHead(404); return res.end('not found'); } res.writeHead(200, { 'Content-Type': TYPES['.md'] }); return res.end(fs.readFileSync(d.src)); }
    let p = decodeURIComponent(url.pathname); if (p === '/') p = '/index.html';
    const file = path.normalize(path.join(OUT_DIR, p));
    if (!file.startsWith(OUT_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  }).listen(PORT, '127.0.0.1', () => console.log(`pending-blogs reader on http://127.0.0.1:${PORT}/  (notes → ${rel(NOTES)})`));
}
