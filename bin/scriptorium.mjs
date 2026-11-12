// scriptorium.mjs — build scroll.mages.city: the Scriptorium's own home. Every scroll in the City in one place,
// in the scrolls' own voice: each quest's scroll (site/chains.json) and each mage's own scroll (bin/scrolls.mjs),
// the star of their roots, and the trinkets shelf (the Prism, Sigil). Nothing but names the City already shows,
// seals, roots, dates and numerals. The Prism figure is read from site/arena.html so the two pages share one drawing.
// usage: node bin/scriptorium.mjs      out: deploy/scroll.mages.city/{public,wrangler.jsonc}
// Deploy (Mitch): cd deploy/scroll.mages.city && npx wrangler deploy
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import { scrolls } from "./scrolls.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), SITE = path.join(ROOT, "site");
const OUT = path.join(ROOT, "deploy", "scroll.mages.city"), PUB = path.join(OUT, "public");
const PRISM = "https://prism.mages.city/";
// a quest's lane -> the mage the Prism files its scrolls under (prism_mage/viewer/build_prism.py MAGES)
const MAGE = [[/^hashsmash/, "hashsmash"], [/^sig-golf/, "sig"], [/^curvesmash/, "curve"], [/^ec-rank/, "ec-rank"], [/^shorecdlp/, "shorecdlp"],
  [/^falcon/, "falcon"], [/^lattice/, "lattice"], [/^formal/, "formal"], [/^(flashprove|harness)/, "flashprove"], [/^poc/, "poc"]];
const mageOf = lane => (MAGE.find(([re]) => re.test(String(lane))) || [null, ""])[1];
// hosts named in the lists that do not resolve yet (see docs/CITY_CONSOLIDATION_PLAN_2026-11-12.md): shown, marked
const NOT_YET_OPEN = new Set([]);
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hx = k => String(k || "").split(":").pop();

const chains = JSON.parse(fs.readFileSync(path.join(SITE, "chains.json"), "utf8")).chains || [];
const quests = new Set(chains.map(c => c.id));
const own = scrolls("").filter(s => !quests.has(s.id));

// the shared Prism drawing and its styles, lifted from the Scriptorium door on the apex
const arena = fs.readFileSync(path.join(SITE, "arena.html"), "utf8");
const svg = (arena.match(/<svg class="prism-fig"[\s\S]*?<\/svg>/) || [""])[0];
const svgCss = (arena.match(/\.prism-fig\{[\s\S]*?@media \(prefers-reduced-motion:reduce\)\{[^\n]*\}\}/) || [""])[0];
const sgSvg = (arena.match(/<svg class="sigil-fig"[\s\S]*?<\/svg>/) || [""])[0];
const sgCss = (arena.match(/\.sigil-fig\{[\s\S]*?@media \(prefers-reduced-motion:reduce\)\{[^\n]*\}\}/) || [""])[0];
if (!sgSvg || !sgCss) throw new Error("the Sigil figure was not found in site/arena.html");
if (!svg || !svgCss) throw new Error("the Prism figure was not found in site/arena.html");

const verdicts = c => (Array.isArray(c.verdicts) ? c.verdicts : []).map(v => v[1] + " " + String(v[0]).replace(/_/g, " ")).join(" · ");
const questRow = c => `<article class="row">
  <div class="rh"><a class="nm" href="${esc(String(c.url).replace(/\/?$/, "/"))}?tab=scroll">${esc(c.name)}</a><span class="ln">${esc(c.lane)}</span></div>
  <div class="seal" title="work root ${esc(c.work_root)}">${esc(c.seal || hx(c.work_root).slice(0, 16))}</div>
  <div class="facts">${esc(c.entries)} ${c.entries == 1 ? "entry" : "entries"} · ${esc(c.lever_leaves)} leaves${c.no_go ? " · " + esc(c.no_go) + " no-go" : ""}${c.minted ? " · " + esc(c.minted) : ""}${verdicts(c) ? "<br>" + esc(verdicts(c)) : ""}</div>
  <div class="doors"><a href="${esc(String(c.url).replace(/\/?$/, "/"))}?tab=scroll">❦ read the scroll</a><a href="${esc(c.url)}">the quest</a>${mageOf(c.lane) ? `<a href="${PRISM}#mage=${esc(mageOf(c.lane))}">◈ read it in the Prism</a>` : ""}</div>
</article>`;
const ownRow = s => {
  const shut = NOT_YET_OPEN.has(s.id);
  return `<article class="row own${shut ? " shut" : ""}"><div class="rh">${shut ? `<span class="nm">${esc(String(s.label).replace(/^❦\s*/, ""))}</span><span class="ln">opening soon</span>` : `<a class="nm" href="${esc(s.href)}">${esc(String(s.label).replace(/^❦\s*/, ""))}</a>`}</div>
  ${shut ? "" : `<div class="doors"><a href="${esc(s.href)}">❦ read the scroll</a></div>`}</article>`;
};

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Scriptorium · Mages City</title>
<meta name="description" content="The Scriptorium: mages' scrolls, made for scrolling. Every scroll in the City, sealed under its root, and the Prism that reads them.">
<link rel="stylesheet" href="sigil/fonts.css"><link rel="icon" href="https://mages.city/favicon.svg">
<style>
:root{--bg:#080c18;--panel:#0e1422;--line:#273047;--ink:#e8e4d8;--muted:#a8b1c3;--gold:#e8c873;--teal:#9fd6db;--violet:#c1c8ef;--rose:#e5a49c;--sig:"Noto Sans Ethiopic","Noto Sans Canadian Aboriginal",system-ui,sans-serif}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:var(--teal);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:1080px;margin:auto;padding:0 24px 64px}
.home{display:flex;justify-content:space-between;align-items:center;padding:18px 0;border-bottom:1px solid var(--line);font:13px ui-monospace,monospace;color:var(--muted)}
.home a{color:var(--ink)}
.tag{font:12px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:42px 0 6px}
h1{font:400 46px/1.1 Georgia,"Times New Roman",serif;margin:0 0 10px}
h1 em{color:var(--gold);font-style:italic}
.lede{max-width:700px;color:var(--muted);font-size:17px}
.lede b{color:var(--ink)}
h2{font:400 28px/1.2 Georgia,serif;margin:48px 0 6px}
.note{color:var(--muted);font-size:14px;max-width:720px;margin:0 0 16px}
.rows{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.row{border:1px solid var(--line);background:var(--panel);padding:14px 16px;border-radius:4px;display:flex;flex-direction:column;gap:6px}
.rh{display:flex;flex-direction:column}
.nm{font:500 19px Georgia,serif;color:var(--ink)}
.ln{font:11.5px ui-monospace,monospace;color:var(--muted)}
.seal{font:20px/1.3 var(--sig);color:var(--gold);letter-spacing:.05em;overflow-wrap:anywhere}
.facts{font:12px/1.55 ui-monospace,monospace;color:var(--muted)}
.doors{display:flex;flex-wrap:wrap;gap:6px 14px;font:12.5px ui-monospace,monospace;margin-top:auto}
.row.own{min-height:0}.row.shut .nm{color:var(--muted)}
.trinkets{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}
.trinket{border:1px solid #3a3420;background:var(--panel);padding:16px 18px;border-radius:4px}
.trinket h3{font:500 20px Georgia,serif;margin:0 0 4px}
.trinket p{color:var(--muted);font-size:14px;margin:8px 0}
.trinket .go{font:13px ui-monospace,monospace}
${svgCss}
${sgCss}
.foot{margin-top:56px;border-top:1px solid var(--line);padding-top:16px;font:12.5px ui-monospace,monospace;color:var(--muted)}
</style></head><body><div class="wrap">
<div class="home"><a href="https://mages.city/">← mages.city</a><span><a href="https://mages.city/star.html">✦ the star</a> · <a href="${PRISM}">◈ the Prism</a> · <a href="https://sigil.mages.city/">✍ Sigil</a></span></div>
<p class="tag">the scriptorium · κ scrolls</p>
<h1>The <em>Scriptorium</em></h1>
<p class="lede"><b>Mages' scrolls, made for scrolling.</b> Every run a mage makes is written as a scroll: each thing named by the hash of what it was, the failed tries kept beside the ones that held, all sealed under one root. Here is every scroll in the City. What their hashes hold stays with members; that they hold, anyone can see.</p>

<h2>The quests' scrolls</h2>
<p class="note">Every problem a mage takes on is a quest with a home of its own. The seal is the quest's work root written as one word; a single wrong letter breaks it.</p>
<div class="rows">${chains.map(questRow).join("\n")}</div>

<h2>The mages' own scrolls</h2>
<p class="note">Scrolls the mages keep of their own work: the soul mage's census of the universe, the guide's registry, each mage's sealed evidence.</p>
<div class="rows">${own.map(ownRow).join("\n")}</div>

<h2>The star of their roots</h2>
<p class="note">Every scroll's roots land on the City's sixty-four states by their first six bits. Compose a face of them, and hold the face to the Prism. <a href="https://mages.city/star.html">✦ the star of the chains →</a></p>

<h2 id="trinkets">Trinkets</h2>
<p class="note">Things a mage carries. Each does one thing to a scroll, in your browser, and adds nothing of its own.</p>
<div class="trinkets">
<div class="trinket"><h3>◈ The Prism</h3>${svg}<p><b>The trinket that reads any mage's scroll.</b> Hold a scroll to it and the white light of one root splits into the threads that hold it. Hold a hash, a seal, or a face of the evidence, and it finds the scrolls that carry it. 🧙 the mage casts, and the light walks the threads; ⚔️ the swordsman cuts one, and the light stops where the scroll breaks. Where it does not break, the cut has found a gap, and a gap is where a mage can build.</p><a class="go" href="${PRISM}">carry the Prism →</a></div>
<div class="trinket"><h3>✍ Sigil</h3>${sgSvg}<p><b>A seal, checked.</b> Any 32-byte root written as one word of twenty-five letters from fifteen scripts, with a check: one misread letter and the seal says so. Check a seal, or look one up.</p><a class="go" href="https://sigil.mages.city/">open Sigil →</a></div>
</div>

<p class="foot">The Scriptorium of <a href="https://mages.city/">Mages City</a> · ${chains.length + own.length} scrolls · built ${new Date().toISOString().slice(0, 10)} · <a href="https://mages.city/scrolls">the Scriptorium's door on the City</a></p>
</div></body></html>
`;

// nothing private leaves: no home paths, no machine names
if (/[a-z]:[\\/]users[\\/]|\/home\/|\\\\wsl/i.test(html)) throw new Error("leak: a local path in the Scriptorium page");
fs.mkdirSync(PUB, { recursive: true });
fs.writeFileSync(path.join(PUB, "index.html"), html);
const sig = path.join(PUB, "sigil"); fs.mkdirSync(path.join(sig, "fonts"), { recursive: true });
fs.copyFileSync(path.join(SITE, "sigil", "fonts.css"), path.join(sig, "fonts.css"));
for (const f of fs.readdirSync(path.join(SITE, "sigil", "fonts"))) fs.copyFileSync(path.join(SITE, "sigil", "fonts", f), path.join(sig, "fonts", f));
fs.writeFileSync(path.join(OUT, "wrangler.jsonc"), `// scroll.mages.city: the Scriptorium. Static assets only, no code.
// Built by mages_city bin/scriptorium.mjs from site/chains.json and the scroll list. Deploy (Mitch): npx wrangler deploy
{
  "name": "mages-city-scroll",
  "compatibility_date": "2026-08-01",
  "assets": { "directory": "./public", "html_handling": "auto-trailing-slash" },
  "routes": [ { "pattern": "scroll.mages.city", "custom_domain": true } ]
}
`);
console.log(`scroll.mages.city built: ${chains.length} quest scrolls + ${own.length} mages' scrolls, ${Math.round(html.length / 1024)} KB, leak check clean`);
