// Build sigil.mages.city from the City's own seal page: deploy/sigil.mages.city/public/
//   index.html  = site/seal.html, its relative links to City pages rewritten to https://mages.city/
//   seals.json  = the City's seal index (same file the apex serves)
//   sigil/      = the pinned encoder, its fonts and the shared checker
// usage: node bin/sigil-site.mjs
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), SITE = path.join(ROOT, "site"), OUT = path.join(ROOT, "deploy", "sigil.mages.city", "public");
fs.mkdirSync(OUT, { recursive: true }); for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f), { recursive: true, force: true }); // keep the folder: a local server may hold it open
let html = fs.readFileSync(path.join(SITE, "seal.html"), "utf8");
// City pages the seal page links to live on the apex; its own assets stay beside it
html = html.replace(/(href|src)="(?!https?:|#|sigil\/|seals\.json)([^"]+)"/g, (m, a, u) => `${a}="https://mages.city/${u}"`);
// a lookup hit opens the chain on its own subdomain already (absolute urls in seals.json); local builds keep their local links
fs.writeFileSync(path.join(OUT, "index.html"), html);
fs.copyFileSync(path.join(SITE, "seals.json"), path.join(OUT, "seals.json"));
// the guide's κ-registry rides with the reader, which re-derives a guide hash through it (sigil/kappa.js)
if (fs.existsSync(path.join(SITE, "guide-registry.json"))) fs.copyFileSync(path.join(SITE, "guide-registry.json"), path.join(OUT, "guide-registry.json"));
fs.cpSync(path.join(SITE, "sigil"), path.join(OUT, "sigil"), { recursive: true });
const leaks = [];
for (const f of fs.readdirSync(OUT, { recursive: true })) { const p = path.join(OUT, f); if (fs.statSync(p).isFile() && /\.(html|js|json|css|md)$/.test(f)) { const t = fs.readFileSync(p, "utf8"); if (/C:\|\/Users\/|~\/|localhost:\d/.test(t)) leaks.push(f); } }
if (leaks.length) { console.error("leak scan: local paths in " + leaks.join(", ")); process.exit(1); }
console.log(`sigil.mages.city built: ${fs.readdirSync(OUT, { recursive: true }).length} files in deploy/sigil.mages.city/public, leak scan clean`);
