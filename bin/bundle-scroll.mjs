// bundle-scroll.mjs — any sealed κ-evidence bundle (root.json + graph.json) as a scroll of the City: nothing but its
// hashes, each record then the threads drawn from it, one book per bundle, on the shared page (bin/scroll-page.mjs).
// Its hashes join the City's seal ledger (site/<id>-seals.json, merged into site/seals.json); the scroll joins the
// list of scrolls (bin/scrolls.mjs reads site/scrolls.json). No names, kinds or labels leave: only κ, roots, dates.
//
// usage: node bin/bundle-scroll.mjs <id> <bundle dir> [<bundle dir> …] --title "…" --h1 "…" --epi "…" [--domain x.mages.city]
//   out: deploy/<domain>/{public,wrangler.jsonc}, site/<id>/index.html, site/<id>-seals.json, site/scrolls.json
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import { scrollPage } from "./scroll-page.mjs"; import { scrollsLine } from "./scrolls.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), SITE = path.join(ROOT, "site");
const argv = process.argv.slice(2), opt = {}, dirs = [];
for (let i = 1; i < argv.length; i++) { if (argv[i].startsWith("--")) { opt[argv[i].slice(2)] = argv[i + 1]; i++; } else dirs.push(argv[i]); }
const id = argv[0], domain = opt.domain || `${id}.mages.city`, label = opt.label || opt.title || id;
if (!id || !dirs.length || !opt.title) { console.error("usage: node bin/bundle-scroll.mjs <id> <bundle dir>… --title … --h1 … --epi … [--domain …] [--label …]"); process.exit(2); }
const NUM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"], hx = k => String(k).split(":").pop();
const books = [];
for (const [bi, d] of dirs.entries()) {
  const g = JSON.parse(fs.readFileSync(path.join(d, "graph.json"), "utf8")), r = JSON.parse(fs.readFileSync(path.join(d, "root.json"), "utf8"));
  const objs = Object.keys(g.objects), at = new Map(objs.map((k, i) => [k, i]));
  const edges = (g.edges || []).filter(e => at.has(e.source) && at.has(e.target) && e.kappa);
  const out = new Map(); edges.forEach((e, i) => { if (!out.has(e.source)) out.set(e.source, []); out.get(e.source).push(i); });
  const seq = []; for (const k of objs) { seq.push([0, at.get(k)]); for (const ei of out.get(k) || []) seq.push([1, ei]); }
  books.push({ n: NUM[bi] || String(bi + 1), root: hx(r.root_kappa), ...(r.root_blake3 ? { b3: hx(r.root_blake3) } : {}), minted: r.minted_on || "", objects: objs.map(hx),
    edges: edges.map(e => [hx(e.kappa), at.get(e.source), at.get(e.target)]), seq });
}
const total = books.reduce((a, b) => a + b.objects.length + b.edges.length + 1, 0);
const DATA = { books, epochs: [], total, built: new Date().toISOString().slice(0, 10) };
(function guard(v, p) {   // nothing but hashes, dates and numerals
  if (typeof v === "string") { if (!/^([0-9a-f]{64}|\d{4}-\d{2}-\d{2}|[IVX]+|\d+)$/.test(v)) throw Error("not a hash: " + p + " = " + v.slice(0, 40)); }
  else if (Array.isArray(v)) v.forEach((x, i) => guard(x, p + "[" + i + "]"));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) guard(x, p + "." + k);
})(DATA, "DATA");

// the list of scrolls is kept in site/scrolls.json; this scroll registers itself before the page is written
const LIST = path.join(SITE, "scrolls.json"), list = fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, "utf8")) : [];
if (!list.some(s => s.id === id)) list.push({ id, label: `❦ ${label}`, href: `https://${domain}/` });
fs.writeFileSync(LIST, JSON.stringify(list, null, 1));

const html = scrollPage(DATA, {
  title: `${opt.title} · Mages City`, desc: opt.desc || opt.epi, h1: opt.h1 || opt.title, epi: opt.epi,
  colophon: '<b>{total}</b> hashes · {books} book(s) · inscribed {built}<br>Each hash names one record or one thread between two records, as the bundle sealed them; the root folds them. This scroll is the inscription, not the proof: the sealed bundle re-derives every root. Seals are written with <a href="https://github.com/johnservil/sigil">Sigil</a>; a hash lands on the star by its first bits.<br><a href="https://sigil.mages.city/">Check any of them at sigil.mages.city →</a>',
  kinds: ["a record", "a thread", "a root"], scrollsLine: scrollsLine(id),
});

// the seal ledger: every hash by kind and book, opening the scroll at it
const CHAIN = opt.title, idx = {};
const put = (h, kind, lbl) => { (idx["sha256:" + h] ||= []).push({ chain: CHAIN, kind, label: lbl, url: `https://${domain}/#k=${h}`, local: `${id}/#k=${h}` }); };
for (const B of books) { B.objects.forEach(h => put(h, `${id} record`, `book ${B.n}`)); B.edges.forEach(([h]) => put(h, `${id} thread`, `book ${B.n}`)); put(B.root, `${id} root`, `book ${B.n}`); }
fs.writeFileSync(path.join(SITE, `${id}-seals.json`), JSON.stringify({ chain: CHAIN, generated: DATA.built, index: idx }));
{ const sp = path.join(SITE, "seals.json"); if (fs.existsSync(sp)) { const S = JSON.parse(fs.readFileSync(sp, "utf8"));
    for (const k of Object.keys(S.index)) { S.index[k] = S.index[k].filter(x => x.chain !== CHAIN); if (!S.index[k].length) delete S.index[k]; }
    for (const [k, v] of Object.entries(idx)) (S.index[k] ||= []).push(...v);
    S.count = Object.keys(S.index).length; fs.writeFileSync(sp, JSON.stringify(S)); console.log(`seals.json: ${Object.keys(idx).length} ${id} hashes joined (${S.count} in all)`); } }

const OUT = path.join(ROOT, "deploy", domain), PUB = path.join(OUT, "public");
fs.mkdirSync(PUB, { recursive: true }); for (const f of fs.readdirSync(PUB)) fs.rmSync(path.join(PUB, f), { recursive: true, force: true });
fs.writeFileSync(path.join(PUB, "index.html"), html);
fs.cpSync(path.join(SITE, "sigil"), path.join(PUB, "sigil"), { recursive: true });
fs.mkdirSync(path.join(SITE, id), { recursive: true });
fs.writeFileSync(path.join(SITE, id, "index.html"), html.replace(/(href|src)="sigil\//g, '$1="../sigil/'));
fs.writeFileSync(path.join(OUT, "wrangler.jsonc"), `// ${domain}: ${opt.title}, nothing but hashes. Static assets only, no code.
// Built by mages_city bin/bundle-scroll.mjs from its sealed κ-evidence bundle(s). Deploy (Mitch): npx wrangler deploy
{
  "name": "mages-city-${id}",
  "compatibility_date": "2026-08-01",
  "assets": { "directory": "./public", "html_handling": "auto-trailing-slash" },
  "routes": [ { "pattern": "${domain}", "custom_domain": true } ]
}
`);
const leak = /C:\\|\/Users\/|~\/|localhost:\d/.test(html.replace(/https:\/\/[^"' ]+/g, ""));
if (leak) { console.error("leak scan: a local path reached the page"); process.exit(1); }
console.log(`${domain} built: ${total} hashes in ${books.length} book(s), ${(html.length / 1024).toFixed(0)} KB, nothing but hashes, leak scan clean`);
