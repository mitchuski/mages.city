// moon-scroll.mjs — each closed moon of the agentprivacy.ai stars chain as a book of a City scroll: nothing but the
// links' hashes in chain order, under the moon's root, on the shared page (bin/scroll-page.mjs). Mirrors
// bin/bundle-scroll.mjs (one book per sealed root, its own ledger site/<id>-seals.json merged into site/seals.json, its
// own home deploy/<domain>/, registered in site/scrolls.json); here a book is a moon and its records are the moon's links.
//
// Nothing is taken on trust from the stars API. For every moon the builder
//   1. re-derives every link: hash = sha256(prev | leaf | mark | seq), each prev the link before it (the first link's
//      prev is checked against the chain itself, or 64 zeros at seq 0);
//   2. re-derives the root: root = sha256(root + "|" + hash) from 64 zeros over the moon's links in chain order;
//   3. checks the moon is whole (the same links, seqs and hashes as the moon's rows in GET /chain), the counts, and
//      the moon's end (mean synodic month from the new moon of 2000-01-06T18:14Z) against the API's `ends`;
// and refuses to write anything if one of them fails. Marks, leaves, places and times never reach the page: a book
// is its links and its root, and the links alone re-derive the root.
//
// usage: node bin/moon-scroll.mjs [--api http://localhost:8787] [--chain <name>] [--moon moon-YYYY-MM-DD] [--preview]
//   City build (default chain, no --moon, no --preview): every SEALED moon since the first star →
//     deploy/<domain>/{public,wrangler.jsonc}, site/<id>/index.html, site/<id>-seals.json (+ site/seals.json),
//     site/scrolls.json. Open moons are skipped (said so). Nothing is built until the first moon seals.
//   --preview (or --moon, or any --chain other than the default): open moons included, marked "open, not yet sealed";
//     written only to .run/moon-scroll-preview/<chain>/public/ (gitignored), never into site/ or deploy/.
//   --domain moon.mages.city --id moon : where the scroll lives (the host is Mitch's choice; nothing is deployed here).
//   --now <ISO time> : judge which moons are sealed as of this time instead of the clock (tests only; the API's own
//     `sealed` must still agree, so against a live chain this only refuses).
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto"; import vm from "node:vm"; import { fileURLToPath } from "node:url";
import { scrollPage } from "./scroll-page.mjs"; import { scrollsLine } from "./scrolls.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), SITE = path.join(ROOT, "site");
const argv = process.argv.slice(2), opt = {}, FLAGS = new Set(["preview"]);
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (!a.startsWith("--")) { console.error("unexpected argument: " + a); process.exit(2); } const k = a.slice(2); if (FLAGS.has(k)) opt[k] = true; else { opt[k] = argv[i + 1]; i++; } }
const API = String(opt.api || "http://localhost:8787").replace(/\/$/, ""), DEFAULT_CHAIN = "agentprivacy";
const CHAIN = String(opt.chain || DEFAULT_CHAIN).replace(/[^a-z0-9-]/g, "").slice(0, 40) || DEFAULT_CHAIN;   // the worker's own rule
const id = opt.id || "moon", domain = opt.domain || `${id}.mages.city`;
const PREVIEW = !!opt.preview || !!opt.moon || CHAIN !== DEFAULT_CHAIN;
const ZERO = "0".repeat(64), HEX = /^[0-9a-f]{64}$/, MOON = /^moon-\d{4}-\d{2}-\d{2}$/;
const SYNODIC = 29.530588853 * 86400000, EPOCH = Date.UTC(2000, 0, 6, 18, 14);
const moonAt = t => { const s = EPOCH + Math.floor((t - EPOCH) / SYNODIC) * SYNODIC; return { id: "moon-" + new Date(s).toISOString().slice(0, 10), start: s, end: s + SYNODIC }; };
const moonOf = mid => moonAt(Date.parse(mid.slice(5) + "T00:00:00Z") + 86400000 * 2);   // the worker's moonEnd(), whole
const sha = s => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const q = (p, extra = "") => `${API}${p}?chain=${encodeURIComponent(CHAIN)}${extra}`;
async function get(url) { const r = await fetch(url, { signal: AbortSignal.timeout(20000) }); if (!r.ok) throw Error(`${url} answered ${r.status}`); return r.json(); }
const fail = m => { console.error("REFUSED: " + m + "\nnothing written."); process.exit(1); };

// the whole chain, compact: [seq, type, mark, hash, at, place, moon]; rows before moons existed carry no moon
const chainRows = [];
for (let since = 0; ;) { const c = await get(q("/chain", `&since=${since}`)); chainRows.push(...c.rows); if (!c.more || !c.rows.length) break; since = c.rows[c.rows.length - 1][0] + 1; }
chainRows.forEach((r, i) => { if (r[0] !== i) fail(`the chain skips at seq ${i} (found ${r[0]})`); });
const moonIds = [...new Set(chainRows.map(r => r[6]).filter(Boolean))].sort();
if (opt.moon && !MOON.test(opt.moon)) fail("give a moon as moon-YYYY-MM-DD");
const wanted = opt.moon ? [opt.moon] : moonIds, now = opt.now ? Date.parse(opt.now) : Date.now();
if (Number.isNaN(now)) fail("--now is not a time");
console.log(`stars chain "${CHAIN}" at ${API}: ${chainRows.length} links, ${moonIds.length} moon(s) with stars${moonIds.length ? " (" + moonIds.join(", ") + ")" : ""}`);

const books = [], skipped = [], NUM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const secret = new Set();   // marks and leaves: checked never to reach the page
for (const mid of wanted) {
  const M = moonOf(mid); if (M.id !== mid) fail(`${mid} is not the start of a moon (that moon is ${M.id})`);
  const sealed = now >= M.end;
  if (!sealed && !PREVIEW) { skipped.push(`${mid} (open, seals ${new Date(M.end).toISOString().slice(0, 10)})`); continue; }
  const S = await get(q("/scroll", `&moon=${mid}`));
  // 1. every link re-derives, each prev the link before it
  const rows = S.rows || [];
  for (const [i, r] of rows.entries()) {
    for (const k of ["hash", "leaf", "mark", "prev"]) if (!HEX.test(String(r[k]))) fail(`${mid} link ${r.seq}: ${k} is not a hash`);
    if (sha([r.prev, r.leaf, r.mark, r.seq].join("|")) !== r.hash) fail(`${mid} link ${r.seq} does not re-derive from prev|leaf|mark|seq`);
    if (i && (r.seq !== rows[i - 1].seq + 1 || r.prev !== rows[i - 1].hash)) fail(`${mid} link ${r.seq} does not follow link ${rows[i - 1].seq}`);
    secret.add(r.mark); secret.add(r.leaf);
  }
  if (rows.length) { const f = rows[0]; const before = f.seq === 0 ? ZERO : (chainRows[f.seq - 1] || [])[3]; if (f.prev !== before) fail(`${mid} first link ${f.seq} does not follow the chain before it`); }
  // 2. the root folds the links in chain order
  let root = ZERO; for (const r of rows) root = sha(root + "|" + r.hash);
  if (root !== S.root) fail(`${mid} root does not re-derive (API ${S.root}, folded ${root})`);
  // 3. whole, counted, and the same moon
  const inChain = chainRows.filter(r => r[6] === mid);
  if (inChain.length !== rows.length || inChain.some((c, i) => c[0] !== rows[i].seq || c[3] !== rows[i].hash)) fail(`${mid}: /scroll and /chain disagree on the moon's links`);
  if (S.moon !== mid || S.stars !== rows.length || S.marks !== new Set(rows.map(r => r.mark)).size) fail(`${mid}: counts do not match the links`);
  if (S.ends !== new Date(M.end).toISOString()) fail(`${mid}: the API's end ${S.ends} is not the moon's end ${new Date(M.end).toISOString()}`);
  if (S.sealed !== sealed) fail(`${mid}: the API says sealed=${S.sealed}, this clock says ${sealed}`);
  if (!rows.length) { skipped.push(`${mid} (no stars)`); continue; }
  books.push({ n: mid.slice(5), root, minted: sealed ? new Date(M.end).toISOString().slice(0, 10) : "", objects: rows.map(r => r.hash), edges: [], seq: rows.map((_, i) => [0, i]),
    _open: !sealed, _stars: rows.length, _marks: S.marks, _ends: new Date(M.end).toISOString().slice(0, 10) });
  console.log(`  ${mid}: ${rows.length} links from ${S.marks} mark(s) re-derive; root ${root} ${sealed ? "SEALED " + books.at(-1).minted : "OPEN, not yet sealed (seals " + books.at(-1)._ends + ")"}`);
}
if (skipped.length) console.log(`  skipped: ${skipped.join("; ")}${PREVIEW ? "" : " — open moons wait for their seal; --preview shows them"}`);
if (!books.length) { console.log(PREVIEW ? "no moon with stars to preview; nothing written." : `no sealed moon with stars yet; nothing written.`); process.exit(0); }

// nothing but hashes, dates and numerals (the private fields stay off DATA; the meta line is composed after the guard)
const total = books.reduce((a, b) => a + b.objects.length + 1, 0);
const DATA = { books: books.map(({ n, root, minted, objects, edges, seq }) => ({ n, root, minted, objects, edges, seq })), epochs: [], total, built: new Date().toISOString().slice(0, 10) };
(function guard(v, p) {
  if (typeof v === "string") { if (!/^([0-9a-f]{64}|\d{4}-\d{2}-\d{2}|[IVX]+|\d+)$/.test(v) && !(p.endsWith(".minted") && v === "")) throw Error("not a hash: " + p + " = " + v.slice(0, 40)); }
  else if (Array.isArray(v)) v.forEach((x, i) => guard(x, p + "[" + i + "]"));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) guard(x, p + "." + k);
})(DATA, "DATA");
DATA.books.forEach((B, i) => { const b = books[i];
  B.meta = (b._open ? `open, not yet sealed · seals ${b._ends}` : `sealed ${b.minted}`) + ` · ${b._stars} links · ${b._marks} ${b._marks === 1 ? "mark" : "marks"}`; });

// the Sigil seal of each root, as the page writes it (site/sigil/sigilcode.js)
const ctx = { globalThis: {} }; ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(SITE, "sigil", "sigilcode.js"), "utf8"), ctx);
const sealOf = h => ctx.SigilCode.encode(Uint8Array.from(Buffer.from(h, "hex")));
for (const B of books) console.log(`  seal ${B.n}: ${sealOf(B.root)}`);

const open = books.some(b => b._open);
const html = scrollPage(DATA, {
  title: `The moon scroll · Mages City`, desc: "Each closed moon of the agentprivacy.ai stars chain, written as nothing but its hashes under the moon’s root.",
  h1: "The <em>moon</em> scroll",
  epi: "Each moon, visitors to agentprivacy.ai commit a constellation of up to forty-two deliberate stars to one shared chain. When the moon closes, its links are sealed under a single root. Here each moon is a book of those links, nothing but their hashes: what a star was stays with the one who made it; that it was made, anyone can check.",
  colophon: '<b>{total}</b> hashes · {books} moon(s) · inscribed {built}<br>Each hash is one link of the stars chain: sha256 of the link before it, the star’s leaf, its mark and its place in the chain. A moon’s root folds its links in chain order from 64 zeros, root = sha256(root | link), so the links on this page re-derive their root by themselves. This scroll is the inscription, not the proof: the chain re-derives every link. Seals are written with <a href="https://github.com/johnservil/sigil">Sigil</a>; a hash lands on the star by its first bits.<br><a href="https://sigil.mages.city/">Check any of them at sigil.mages.city →</a>',
  kinds: ["a link", "a thread", "a moon’s root"], scrollsLine: scrollsLine(id), noPrism: true,
  topLine: open ? '<p class="scrolls" style="color:var(--coral)">preview · a moon marked open is not yet sealed: its links and root will still grow until it closes</p>' : "",
});

// fail closed: no local path, no mark or leaf, no unreleased name
const bare = html.replace(/https:\/\/[^"' ]+/g, "");
if (/C:\\|\/Users\/|~\/|localhost:\d/.test(bare)) fail("leak scan: a local path reached the page");
for (const s of secret) if (html.includes(s)) fail("leak scan: a mark or leaf reached the page");
if (/poaw/i.test(html)) fail("leak scan: an unreleased name reached the page");

const copySigil = PUB => fs.cpSync(path.join(SITE, "sigil"), path.join(PUB, "sigil"), { recursive: true });
if (PREVIEW) {
  const PUB = path.join(ROOT, ".run", "moon-scroll-preview", CHAIN, "public");
  fs.rmSync(PUB, { recursive: true, force: true }); fs.mkdirSync(PUB, { recursive: true });
  fs.writeFileSync(path.join(PUB, "index.html"), html); copySigil(PUB);
  console.log(`preview written: ${path.relative(ROOT, PUB)}/index.html · ${total} hashes in ${books.length} book(s), ${(html.length / 1024).toFixed(0)} KB, leak scan clean (site/, deploy/, ledgers untouched)`);
  process.exit(0);
}

// the City build: the list of scrolls, the seal ledger, the home and the apex copy
const LIST = path.join(SITE, "scrolls.json"), list = fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, "utf8")) : [];
if (!list.some(s => s.id === id)) { list.push({ id, label: "❦ moon scroll", href: `https://${domain}/` }); fs.writeFileSync(LIST, JSON.stringify(list, null, 1)); }
const LEDGER = "the moon scroll", idx = {};
const put = (h, kind, lbl) => { (idx["sha256:" + h] ||= []).push({ chain: LEDGER, kind, label: lbl, url: `https://${domain}/#k=${h}`, local: `${id}/#k=${h}` }); };
for (const B of DATA.books) { B.objects.forEach(h => put(h, `${id} link`, `moon ${B.n}`)); put(B.root, `${id} root`, `moon ${B.n}`); }
fs.writeFileSync(path.join(SITE, `${id}-seals.json`), JSON.stringify({ chain: LEDGER, generated: DATA.built, index: idx }));
{ const sp = path.join(SITE, "seals.json"); if (fs.existsSync(sp)) { const S = JSON.parse(fs.readFileSync(sp, "utf8"));
    for (const k of Object.keys(S.index)) { S.index[k] = S.index[k].filter(x => x.chain !== LEDGER); if (!S.index[k].length) delete S.index[k]; }
    for (const [k, v] of Object.entries(idx)) (S.index[k] ||= []).push(...v);
    S.count = Object.keys(S.index).length; fs.writeFileSync(sp, JSON.stringify(S)); console.log(`seals.json: ${Object.keys(idx).length} ${id} hashes joined (${S.count} in all)`); } }
const OUT = path.join(ROOT, "deploy", domain), PUB = path.join(OUT, "public");
fs.mkdirSync(PUB, { recursive: true }); for (const f of fs.readdirSync(PUB)) fs.rmSync(path.join(PUB, f), { recursive: true, force: true });
fs.writeFileSync(path.join(PUB, "index.html"), html); copySigil(PUB);
fs.mkdirSync(path.join(SITE, id), { recursive: true });
fs.writeFileSync(path.join(SITE, id, "index.html"), html.replace(/(href|src)="sigil\//g, '$1="../sigil/'));
fs.writeFileSync(path.join(OUT, "wrangler.jsonc"), `// ${domain}: the moon scroll, nothing but hashes. Static assets only, no code.
// Built by mages_city bin/moon-scroll.mjs from the stars chain's sealed moons. Deploy (Mitch): npx wrangler deploy
{
  "name": "mages-city-${id}",
  "compatibility_date": "2026-08-01",
  "assets": { "directory": "./public", "html_handling": "auto-trailing-slash" },
  "routes": [ { "pattern": "${domain}", "custom_domain": true } ]
}
`);
console.log(`${domain} built: ${total} hashes in ${books.length} sealed moon(s), ${(html.length / 1024).toFixed(0)} KB, nothing but hashes, leak scan clean`);
