// Build soul.mages.city: the soul mage's scroll. One page, nothing but hashes: every record the soul mage sealed and
// every thread it drew between them, read as one long spell. The hash/seal switch turns the whole scroll from hex
// into Sigil seals; the star beside it places every hash on the City's 64 states and lights what you are reading.
// Reads ~/soul_mage/kappa (read only: the soul mage reads every lane and writes into none). No names, no kinds,
// no relations, no labels leave: only κ, the chains' roots, their mint dates and counts.
// usage: node bin/soul-scroll.mjs [soul_mage/kappa dir]     out: deploy/soul.mages.city/{public,wrangler.jsonc} + site/soul/index.html
import fs from "node:fs"; import { scrollPage } from "./scroll-page.mjs"; import { scrollsLine } from "./scrolls.mjs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), SITE = path.join(ROOT, "site");
const KAPPA = process.argv[2] || path.join(ROOT, "..", "soul_mage", "kappa");
const OUT = path.join(ROOT, "deploy", "soul.mages.city"), PUB = path.join(OUT, "public");
const CHAINS = ["fleet-chain", "work-chain", "research-chain", "fund-chain"];  // read order; shown only as I–IV
const NUM = ["I", "II", "III", "IV", "V"];
const hx = k => String(k).split(":").pop();
const books = [];
for (const [bi, c] of CHAINS.entries()) {
  const dir = path.join(KAPPA, c); if (!fs.existsSync(dir)) continue;
  const g = JSON.parse(fs.readFileSync(path.join(dir, "graph.json"), "utf8")), r = JSON.parse(fs.readFileSync(path.join(dir, "root.json"), "utf8"));
  const objs = Object.keys(g.objects), at = new Map(objs.map((k, i) => [k, i]));
  const edges = g.edges.filter(e => at.has(e.source) && at.has(e.target));
  // the spell: each record, then the threads drawn from it (edges by source, in graph order)
  const out = new Map(); edges.forEach((e, i) => { if (!out.has(e.source)) out.set(e.source, []); out.get(e.source).push(i); });
  const seq = []; for (const k of objs) { seq.push([0, at.get(k)]); for (const ei of out.get(k) || []) seq.push([1, ei]); }
  books.push({ n: NUM[bi], root: hx(r.root_kappa), b3: r.root_blake3 ? hx(r.root_blake3) : null, merkle: r.merkle_root_sha256 ? hx(r.merkle_root_sha256) : null,
    minted: r.minted_on || "", objects: objs.map(hx), edges: edges.map(e => [hx(e.kappa), at.get(e.source), at.get(e.target)]), seq });
}
// the sealed epochs: earlier roots kept, never rewritten
let epochs = [];
try { const E = JSON.parse(fs.readFileSync(path.join(KAPPA, "fleet-chain-epochs", "EPOCHS.json"), "utf8")); epochs = (E.epochs || []).map(e => ({ root: hx(e.root), minted: e.minted_on || "" })); } catch {}
const total = books.reduce((a, b) => a + b.objects.length + b.edges.length, 0) + books.length + epochs.length;
const DATA = { books, epochs, total, built: new Date().toISOString().slice(0, 10) };
// nothing but hashes: refuse to write if any string other than hex, dates, roman numerals or numbers slipped in
(function guard(v, p) {
  if (typeof v === "string") { if (!/^([0-9a-f]{64}|\d{4}-\d{2}-\d{2}|[IV]+)$/.test(v)) throw Error("not a hash: " + p + " = " + v.slice(0, 40)); }
  else if (Array.isArray(v)) v.forEach((x, i) => guard(x, p + "[" + i + "]"));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) guard(x, p + "." + k);
})(DATA, "DATA");

const html = scrollPage(DATA, {
  title: "Soul Mage's Scroll · Mages City",
  desc: "An inscription of the spells the soul mage has cast to keep the agentprivacy universe coherent, written as nothing but their hashes.",
  h1: "Soul Mage's <em>Scroll</em>",
  epi: "An inscription of the spells the soul mage has cast to keep the agentprivacy universe coherent: every record it read across the lanes, every thread it drew between them, each sealed under a root. Nothing of what they say is written here. Only their names, which are their hashes.",
  colophon: '<b>{total}</b> hashes · {books} books · inscribed {built}<br>Each hash names one record or one thread between two records, as the soul mage sealed it; the roots fold them. This scroll is the inscription, not the proof: the sealed bundles re-derive every root. Seals are written with <a href="https://github.com/johnservil/sigil">Sigil</a>; a hash lands on the star by its first bits.<br><a href="https://sigil.mages.city/">Check any of them at sigil.mages.city →</a> · <a href="https://guide.mages.city/">the guide\'s scroll →</a>',
  kinds: ["a record", "a thread", "a root"],
  scrollsLine: scrollsLine("soul"),
});

// the City's seal reader looks hashes up in site/seals.json: the scroll's hashes join it by kind and book, nothing more
const SOUL = "The soul mage's scroll", idx = {};
const put = (h, kind, label) => { (idx["sha256:" + h] ||= []).push({ chain: SOUL, kind, label, url: `https://soul.mages.city/#k=${h}`, local: `soul/#k=${h}` }); };
for (const B of books) { B.objects.forEach(h => put(h, "soul record", `book ${B.n}`)); B.edges.forEach(([h]) => put(h, "soul thread", `book ${B.n}`)); put(B.root, "soul root", `book ${B.n}`); }
epochs.forEach(E => put(E.root, "sealed epoch", "book V"));
fs.writeFileSync(path.join(SITE, "soul-seals.json"), JSON.stringify({ chain: SOUL, generated: DATA.built, index: idx }));
{ const sp = path.join(SITE, "seals.json"); if (fs.existsSync(sp)) { const S = JSON.parse(fs.readFileSync(sp, "utf8"));
    for (const k of Object.keys(S.index)) { S.index[k] = S.index[k].filter(x => x.chain !== SOUL); if (!S.index[k].length) delete S.index[k]; }
    for (const [k, v] of Object.entries(idx)) (S.index[k] ||= []).push(...v);
    S.count = Object.keys(S.index).length; fs.writeFileSync(sp, JSON.stringify(S)); console.log(`seals.json: ${Object.keys(idx).length} soul hashes joined (${S.count} in all)`); } }
fs.mkdirSync(PUB, { recursive: true }); for (const f of fs.readdirSync(PUB)) fs.rmSync(path.join(PUB, f), { recursive: true, force: true });
fs.writeFileSync(path.join(PUB, "index.html"), html);
// the same scroll, as it is, inside the City at mages.city/soul/ (its own folder: a standalone page, no shared header);
// only its asset paths change, to the City's own sigil/ beside it
const CITY = path.join(SITE, "soul"); fs.mkdirSync(CITY, { recursive: true });
fs.writeFileSync(path.join(CITY, "index.html"), html.replace(/(href|src)="sigil\//g, '$1="../sigil/'));
fs.cpSync(path.join(SITE, "sigil"), path.join(PUB, "sigil"), { recursive: true });
fs.writeFileSync(path.join(OUT, "wrangler.jsonc"), `// soul.mages.city: the soul mage's scroll, nothing but hashes. Static assets only, no code.
// Built by mages_city bin/soul-scroll.mjs from ~/soul_mage/kappa (read only). Deploy (Mitch): npx wrangler deploy
{
  "name": "mages-city-soul",
  "compatibility_date": "2026-08-01",
  "assets": { "directory": "./public", "html_handling": "auto-trailing-slash" },
  "routes": [ { "pattern": "soul.mages.city", "custom_domain": true } ]
}
`);
const leak = /C:\\|\/Users\/|~\/|soul_mage\/|localhost:\d/.test(html.replace(/https:\/\/[^"' ]+/g, ""));
if (leak) { console.error("leak scan: a local path reached the page"); process.exit(1); }
console.log(`soul.mages.city built: ${DATA.total} hashes in ${books.length} books + ${epochs.length} epoch(s), ${(html.length / 1024).toFixed(0)} KB, nothing but hashes, leak scan clean`);
