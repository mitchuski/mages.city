// Build guide.mages.city: the guide's scroll. Every page of the agentprivacy guide's snapshot, all its federated sites,
// named by the κ of its content (agentprivacy.guide tools/kappa_registry.py) and folded under one root; the guide's
// own page-to-page links drawn as threads on the star. The same page as the soul mage's scroll (bin/scroll-page.mjs);
// the two link to each other. Its hashes join the City's seal index (site/guide-seals.json), each opening its page.
// usage: node bin/guide-scroll.mjs [agentprivacy.guide dir]   out: deploy/guide.mages.city/{public,wrangler.jsonc},
//        site/guide-scroll/index.html, site/guide-seals.json (merged into site/seals.json)
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url"; import { scrollPage } from "./scroll-page.mjs"; import { scrollsLine } from "./scrolls.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), SITE = path.join(ROOT, "site");
const G = process.argv[2] || path.join(ROOT, "..", "agentprivacy.guide");
const OUT = path.join(ROOT, "deploy", "guide.mages.city"), PUB = path.join(OUT, "public");
const reg = JSON.parse(fs.readFileSync(path.join(G, "site", "kappa", "registry.json"), "utf8"));
const hx = k => String(k).split(":").pop();
// the snapshot's own site list: labels and glyphs (tools/snapshot.mjs)
const snap = fs.readFileSync(path.join(G, "tools", "snapshot.mjs"), "utf8"), LBL = {};
const SNAPORDER = [];
for (const m of snap.matchAll(/\{ id: '([\w-]+)'(.*?)\}/gs)) { const g = k => (m[2].match(new RegExp(`\\b${k}: '([^']*)'`)) || [])[1]; LBL[m[1]] = { label: g("label") || m[1], glyph: g("glyph") || "", color: g("color") }; SNAPORDER.push(m[1]); }
LBL.gates = { label: "Gates", glyph: "⚔️", color: "#8a94a8" };
// each book in its own site's colour from the guide, lifted toward white for the dark page; gold stays the roots'
const lift = (hex, t = 0.42) => { const n = parseInt(String(hex || "#8a94a8").slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * t)); return "#" + c.map(v => v.toString(16).padStart(2, "0")).join(""); };
// the guide's links between pages (the star chart's per-page record), matched to registry sites by their path
const PJ = JSON.parse(fs.readFileSync(path.join(G, "site", "star-chart", "data", "pages.json"), "utf8"));
const PJV = Object.values(PJ.pages || PJ);
const SR = reg.site_roots, siteOfChart = {};
for (const [id, s] of Object.entries(SR)) for (const c of [id, s.path, s.path.split("/").pop(), s.path.split("-")[0], s.path.split("-").pop()]) siteOfChart[c] ||= id;
// books: the guide first; then the guide's own site order, the Atlas (the backbone the others link through) last of
// the federation; then the siblings; then the sealed gates
const rank = id => id === "guide" ? -1 : id === "atlas" ? 900 : (SNAPORDER.indexOf(id) >= 0 ? SNAPORDER.indexOf(id) : 800);
const GRP = { federation: 0, sibling: 1, gates: 2 };
const order = Object.entries(SR).sort((a, b) => (GRP[a[1].group] - GRP[b[1].group]) || rank(a[0]) - rank(b[0]));
const books = [], at = {};
for (const [id, s] of order) {
  const es = reg.entries.filter(e => e.site === id);
  es.forEach((e, i) => { at[`${id}/${e.slug}`] = [books.length, i]; });
  books.push({ n: `${LBL[id] ? LBL[id].glyph + " " + LBL[id].label : id}`, root: hx(s.root), minted: reg.snapshot,
    meta: `${s.count} ${id === "gates" ? "sealed gates" : "pages"} · ${s.group}`, objects: es.map(e => hx(e.k)), edges: [], seq: es.map((_, i) => [0, i]) });
}
const links = [];
for (const p of PJV) { const id = siteOfChart[p.site]; if (!id) continue; const a = at[`${id}/${p.slug}`]; if (!a) continue;
  for (const t of p.sorted_links || []) { if (t === p.slug) continue; const b = at[`${id}/${t}`]; if (b) links.push([a[0], a[1], b[0], b[1]]); } }
// the registry's own root and its federation root, as the last book
books.push({ n: "✦ the registry", root: hx(reg.root), minted: reg.snapshot, meta: `snapshot ${reg.snapshot} · the federation root, folding every site`, objects: [hx(reg.federation_root)], edges: [], seq: [[0, 0]] });
const epochs = [];   // earlier registry roots, once there are any (agentprivacy.guide flow/kappa/)
for (const f of fs.readdirSync(path.join(G, "flow", "kappa")).filter(f => /^\d{4}-\d{2}-\d{2}-[0-9a-f]{8}\.json$/.test(f)).sort()) {
  const r = JSON.parse(fs.readFileSync(path.join(G, "flow", "kappa", f), "utf8")); if (r.root !== reg.root) epochs.push({ root: hx(r.root), minted: r.snapshot }); }
const total = books.reduce((a, b) => a + b.objects.length + 1, 0) + epochs.length;
const DATA = { books, epochs, links, total, built: reg.snapshot };

const html = scrollPage(DATA, {
  title: "Guide's Scroll · Mages City",
  desc: "Every page of the agentprivacy guide, named by the hash of its content and folded under one root.",
  h1: "Guide's <em>Scroll</em>",
  epi: "Every page of the agentprivacy guide, across all of its sites, named by the hash of its content and folded under one root. Edit a page and its name changes. The threads are the guide's own links from page to page. What the pages say is on the guide; here they are only their names.",
  colophon: '<b>{total}</b> hashes · {books} books · the snapshot of {built}<br>Each hash is one page\'s content (its title and story, without its journal), as published; each book folds its site\'s pages to a root, and the registry folds the sites. The guide\'s live wiki is compared against it: a page edited since the snapshot shows as a divergence until the next one. Seals are written with <a href="https://github.com/johnservil/sigil">Sigil</a>; a hash lands on the star by its first bits.<br><a href="https://guide.agentprivacy.ai/">the guide →</a> · <a href="https://sigil.mages.city/">check any of them at sigil.mages.city →</a> · <a href="https://soul.mages.city/">the soul mage\'s scroll →</a>',
  kinds: ["a page", "a thread", "a root"],
  scrollsLine: scrollsLine("guide"),
  colours: [...order.map(([id]) => lift(LBL[id] && LBL[id].color)), "#e8c873"],
  skynote: "point at a page to see its links",
});

// the City's seal reader: every guide hash opens its page on the guide (a gate opens the gatehouse)
const GUIDE = "The guide", idx = {};
// each entry also carries its place in the guide's scroll and its snapshot; a page names its site, slug and published
// json, so the reader can re-derive it through the registry (sigil/kappa.js + site/guide-registry.json)
const put = (h, kind, label, url, more = {}) => { (idx["sha256:" + h] ||= []).push({ chain: GUIDE, kind, label, url, local: url, scroll: `https://guide.mages.city/#k=${h}`, snapshot: reg.snapshot, ...more }); };
for (const e of reg.entries) { const s = SR[e.site], L = LBL[e.site] ? LBL[e.site].label : e.site;
  if (e.site === "gates") put(hx(e.k), "sealed gate", "the gatehouse", "https://guide.agentprivacy.ai/gates/", { site: "gates", slug: e.slug });
  else put(hx(e.k), "guide page", `${L} · ${e.slug}`, `https://guide.agentprivacy.ai/${s.path}/${e.slug}.html`, { site: e.site, slug: e.slug, json: `https://guide.agentprivacy.ai/${s.path}/${e.slug}.json` }); }
for (const [id, s] of Object.entries(SR)) put(hx(s.root), "guide site root", LBL[id] ? LBL[id].label : id, `https://guide.mages.city/#k=${hx(s.root)}`, { site: id });
put(hx(reg.federation_root), "guide federation root", `snapshot ${reg.snapshot}`, `https://guide.mages.city/#k=${hx(reg.federation_root)}`, { site: "*" });
put(hx(reg.root), "guide registry root", `snapshot ${reg.snapshot}`, `https://guide.mages.city/#k=${hx(reg.root)}`, { site: "*" });
fs.copyFileSync(path.join(G, "site", "kappa", "registry.json"), path.join(SITE, "guide-registry.json"));   // the seal reader re-derives through it
fs.writeFileSync(path.join(SITE, "guide-seals.json"), JSON.stringify({ chain: GUIDE, generated: reg.snapshot, index: idx }));
{ const sp = path.join(SITE, "seals.json"); if (fs.existsSync(sp)) { const S = JSON.parse(fs.readFileSync(sp, "utf8"));
    for (const k of Object.keys(S.index)) { S.index[k] = S.index[k].filter(x => x.chain !== GUIDE); if (!S.index[k].length) delete S.index[k]; }
    for (const [k, v] of Object.entries(idx)) (S.index[k] ||= []).push(...v);
    S.count = Object.keys(S.index).length; fs.writeFileSync(sp, JSON.stringify(S)); console.log(`seals.json: ${Object.keys(idx).length} guide hashes joined (${S.count} in all)`); } }

fs.mkdirSync(PUB, { recursive: true }); for (const f of fs.readdirSync(PUB)) fs.rmSync(path.join(PUB, f), { recursive: true, force: true });
fs.writeFileSync(path.join(PUB, "index.html"), html);
fs.cpSync(path.join(SITE, "sigil"), path.join(PUB, "sigil"), { recursive: true });
const CITY = path.join(SITE, "guide-scroll"); fs.mkdirSync(CITY, { recursive: true });
fs.writeFileSync(path.join(CITY, "index.html"), html.replace(/(href|src)="sigil\//g, '$1="../sigil/'));
fs.writeFileSync(path.join(OUT, "wrangler.jsonc"), `// guide.mages.city: the guide's scroll, every page of the agentprivacy guide as the hash of its content. Static assets only.
// Built by mages_city bin/guide-scroll.mjs from agentprivacy.guide site/kappa/registry.json. Deploy (Mitch): npx wrangler deploy
{
  "name": "mages-city-guide",
  "compatibility_date": "2026-08-01",
  "assets": { "directory": "./public", "html_handling": "auto-trailing-slash" },
  "routes": [ { "pattern": "guide.mages.city", "custom_domain": true } ]
}
`);
const leak = /C:\\|\/Users\/|~\/|localhost:\d/.test(html.replace(/https:\/\/[^"' ]+/g, ""));
if (leak) { console.error("leak scan: a local path reached the page"); process.exit(1); }
console.log(`guide.mages.city built: ${DATA.total} hashes in ${books.length} books, ${links.length} threads, ${(html.length / 1024).toFixed(0)} KB, leak scan clean`);
