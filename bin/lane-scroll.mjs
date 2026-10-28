// lane-scroll.mjs — many lanes of sealed bundles as one scroll that opens on demand: one book per lane, written as its
// bundles' roots (sha256 κ, with each bundle's BLAKE3 root when it was minted with one), the lane's root folding them
// by the City Key's rule; a click on a bundle root fetches b/<root>.json and unrolls its records and threads in place.
// Same page as every scroll (bin/scroll-page.mjs, lazy mode); lives inside an existing home at <home>/<path>/.
//
// usage: node bin/lane-scroll.mjs bin/scrolls/<id>.json
//   spec: {id, home, path, store (relative to the user's home dir), label, title, h1, epi, colours,
//          lanes:[{name, project (a chain project in blake3_mage levers/projects) | prefix (bundle dirs in the store)}]}
//   out:  deploy/_home/<home>/<path>/ (blake3_mage deploy_copies.py lays it into the home), site/<id>/,
//         site/<id>-seals.json (bundle and lane roots, merged into site/seals.json), site/scrolls.json
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { scrollPage } from "./scroll-page.mjs"; import { scrollsLine } from "./scrolls.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), SITE = path.join(ROOT, "site");
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const STORE = path.join(os.homedir(), spec.store), PROJ = path.join(os.homedir(), "blake3-mage", "blake3-mage", "levers", "projects");
const hx = k => String(k).split(":").pop(), sha = s => crypto.createHash("sha256").update(s).digest("hex");
const fold = xs => { let l = [...xs].sort(); while (l.length > 1) { const n = []; for (let i = 0; i < l.length; i += 2) n.push(i + 1 < l.length ? sha(l[i] + "|" + l[i + 1]) : l[i]); l = n; } return l[0]; };
const guard = (v, p) => {   // nothing but hashes, dates and numerals
  if (typeof v === "string") { if (!/^([0-9a-f]{64}|\d{4}-\d{2}-\d{2}|[IVX]+|\d+)$/.test(v)) throw Error("not a hash: " + p + " = " + v.slice(0, 40)); }
  else if (Array.isArray(v)) v.forEach((x, i) => guard(x, p + "[" + i + "]"));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) guard(x, p + "." + k);
};
const NUM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const books = [], files = {}; let total = 0, twice = 0;
for (const [li, L] of spec.lanes.entries()) {
  const tags = L.project ? JSON.parse(fs.readFileSync(path.join(PROJ, L.project + ".json"), "utf8")).chain.bundles
    : fs.readdirSync(STORE).filter(d => d.startsWith(L.prefix) && fs.existsSync(path.join(STORE, d, "root.json")));
  const roots = [];
  for (const t of tags) {
    const d = path.join(STORE, t), r = JSON.parse(fs.readFileSync(path.join(d, "root.json"), "utf8")), g = JSON.parse(fs.readFileSync(path.join(d, "graph.json"), "utf8"));
    const objs = Object.keys(g.objects), at = new Map(objs.map((k, i) => [k, i]));
    const edges = (g.edges || []).filter(e => at.has(e.source) && at.has(e.target) && e.kappa);
    const out = new Map(); edges.forEach((e, i) => { if (!out.has(e.source)) out.set(e.source, []); out.get(e.source).push(i); });
    const seq = []; for (const k of objs) { seq.push([0, at.get(k)]); for (const ei of out.get(k) || []) seq.push([1, ei]); }
    const root = hx(r.root_kappa);
    if (files[root]) { twice++; continue; }   // one bundle folded into two lanes is written once, in the first
    const X = { objects: objs.map(hx), edges: edges.map(e => [hx(e.kappa), at.get(e.source), at.get(e.target)]), seq, minted: r.minted_on || "", ...(r.root_blake3 ? { b3: hx(r.root_blake3) } : {}) };
    guard(X, `${t}`); files[root] = X; roots.push({ root, minted: r.minted_on || "" }); total += X.objects.length + X.edges.length + 1;
  }
  roots.sort((a, b) => a.minted.localeCompare(b.minted));
  const objects = roots.map(x => x.root);
  books.push({ n: NUM[li] || String(li + 1), root: fold(objects), minted: roots.at(-1)?.minted || "", objects, edges: [], seq: objects.map((_, i) => [0, i]) });
  total += 1;
}
const whole = fold(books.map(b => b.root));
const DATA = { books, epochs: [], total, built: new Date().toISOString().slice(0, 10), lazy: true };
guard(DATA, "DATA");

const href = `https://${spec.home}/${spec.path ? spec.path + "/" : ""}`;
const LIST = path.join(SITE, "scrolls.json"), list = fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, "utf8")) : [];
if (!list.some(s => s.id === spec.id)) list.push({ id: spec.id, label: `❦ ${spec.label}`, href });
fs.writeFileSync(LIST, JSON.stringify(list, null, 1));

const nb = Object.keys(files).length;
const html = scrollPage(DATA, {
  title: `${spec.title} · Mages City`, desc: spec.epi, h1: spec.h1, epi: spec.epi, colours: spec.colours, bookNames: spec.lanes.map(l => l.name),
  colophon: `<b>{total}</b> hashes · ${nb} sealed bundles in {books} lanes · inscribed {built}<br>Each lane is written as the roots of its bundles, its own root folding them (sorted, paired, sha256(a|b), an odd one carried up); the seven lane roots fold to one: <code style="font-size:11px;overflow-wrap:anywhere">sha256:${whole}</code>. ${twice ? `A bundle sealed into two lanes (${twice} of them: casts that were judged on their own and also folded into a wave) is written once, in the first. ` : ""}Open a bundle and its records unroll, each followed by the threads drawn from it, with its BLAKE3 root beside the sha256 one where it was minted with both. This scroll is the inscription, not the proof: every bundle re-derives from its root. Seals are written with <a href="https://github.com/johnservil/sigil">Sigil</a>.<br><a href="https://sigil.mages.city/">Check any of them at sigil.mages.city →</a> · <a href="https://${spec.home}/">the lanes as quests →</a>`,
  kinds: ["a record", "a thread", "a root"], scrollsLine: scrollsLine(spec.id),
  openAll: !!spec.openAll, topLine: spec.quests ? `<nav class="lanes" aria-label="each lane's own scroll">each lane's own scroll: ${spec.quests.map(q => `<a href="${q.href}">${q.name} ↗</a>`).join(" · ")}</nav>` : "", skynote: "point at a hash to see its threads · click a bundle to open it",
});

// the seal ledger: lane roots, the whole fold, and every bundle root (records resolve by opening their bundle)
const CHAIN = spec.title, idx = {};
const put = (h, kind, lbl, b) => { (idx["sha256:" + h] ||= []).push({ chain: CHAIN, kind, label: lbl, url: `${href}#k=${h}${b ? "&b=" + b : ""}`, local: `${spec.id}/#k=${h}` }); };
books.forEach((B, i) => { put(B.root, `${spec.id} lane root`, spec.lanes[i].name); B.objects.forEach(h => put(h, `${spec.id} bundle root`, spec.lanes[i].name)); });
put(whole, `${spec.id} root`, "every lane");
fs.writeFileSync(path.join(SITE, `${spec.id}-seals.json`), JSON.stringify({ chain: CHAIN, generated: DATA.built, index: idx }));
{ const sp = path.join(SITE, "seals.json"); if (fs.existsSync(sp)) { const S = JSON.parse(fs.readFileSync(sp, "utf8"));
    for (const k of Object.keys(S.index)) { S.index[k] = S.index[k].filter(x => x.chain !== CHAIN); if (!S.index[k].length) delete S.index[k]; }
    for (const [k, v] of Object.entries(idx)) (S.index[k] ||= []).push(...v);
    S.count = Object.keys(S.index).length; fs.writeFileSync(sp, JSON.stringify(S)); console.log(`seals.json: ${Object.keys(idx).length} ${spec.id} roots joined (${S.count} in all)`); } }

const write = (dir, page) => {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(path.join(dir, "b"), { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page);
  for (const [r, X] of Object.entries(files)) fs.writeFileSync(path.join(dir, "b", r + ".json"), JSON.stringify(X));
};
const HOME = path.join(ROOT, "deploy", "_home", spec.home, spec.path);
write(HOME, html); fs.cpSync(path.join(SITE, "sigil"), path.join(HOME, "sigil"), { recursive: true });
write(path.join(SITE, spec.id), html.replace(/(href|src)="sigil\//g, '$1="../sigil/'));
const leak = /C:\\|\/Users\/|~\/|localhost:\d/.test(html.replace(/https:\/\/[^"' ]+/g, ""));
if (leak) { console.error("leak scan: a local path reached the page"); process.exit(1); }
const kb = (Object.values(files).reduce((a, X) => a + JSON.stringify(X).length, 0) / 1024).toFixed(0);
console.log(`${href} built: ${total} hashes, ${nb} bundles in ${books.length} lanes; page ${(html.length / 1024).toFixed(0)} KB, bundles ${kb} KB on demand; root sha256:${whole.slice(0, 16)}…; leak scan clean`);
