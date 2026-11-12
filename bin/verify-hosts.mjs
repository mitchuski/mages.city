// verify-hosts.mjs — the City's hosts against hosts.json: does each resolve, answer, lead home, and match the state
// it is meant to be in? Run it after any deploy, or before deciding what to consolidate next.
//   node bin/verify-hosts.mjs            prints one line per host; exit 1 when a host is not in its stated state
//   node bin/verify-hosts.mjs --json     the same as JSON
// live   = must resolve and answer 200 ("api": true = a service: any HTTP answer counts) (a door marked "home": "none" is reported, not failed)
// staged = built and waiting for the keeper's deploy: reported, never failed
// parked = planned; fails if the apex site links to it as if it were live
import fs from "node:fs"; import path from "node:path"; import dns from "node:dns/promises"; import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { hosts } = JSON.parse(fs.readFileSync(path.join(ROOT, "hosts.json"), "utf8"));
const JSONOUT = process.argv.includes("--json");

// where the apex links to each host (prose and menus; seals ledgers excluded: they carry hashes, not links)
const siteRefs = {};
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { if (!/^(sigil|fonts|downloads|images|preview)$/.test(f.name)) walk(p); continue; }
    if (!/\.(html|js|json|md)$/.test(f.name) || /seals\.json$/.test(f.name)) continue;
    const t = fs.readFileSync(p, "utf8");
    for (const m of t.matchAll(/href=["']https:\/\/([a-z0-9.-]+\.mages\.city)/g)) siteRefs[m[1]] = (siteRefs[m[1]] || 0) + 1;
  }
})(path.join(ROOT, "site"));

async function probe(h) {
  const r = { host: h.host, state: h.state, kind: h.kind, dns: false, status: 0, title: "", home: h.home || "", refs: siteRefs[h.host] || 0 };
  try { await dns.lookup(h.host); r.dns = true; } catch { return r; }
  try {
    const res = await fetch(`https://${h.host}/`, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    r.status = res.status; const t = await res.text();
    r.title = (t.match(/<title>([^<]*)/) || [, ""])[1].trim().slice(0, 60);
    if (!r.home) r.home = /href=["']https:\/\/(www\.)?mages\.city\/?["'#]/.test(t) || h.host.endsWith("mages.city") && /href=["']\/["']|href=["']index\.html/.test(t) && h.host === "mages.city" ? "link" : (/mages\.city/.test(t) ? "mention" : "none");
  } catch (e) { r.status = -1; }
  return r;
}

const rows = await Promise.all(hosts.map(probe));
let bad = 0;
for (const r of rows) {
  let verdict = "ok";
  const h = hosts.find(x => x.host === r.host);
  if (r.state === "live" && !(r.dns && (r.status === 200 || (h.api && r.status > 0)))) verdict = "DOWN";
  else if (h.api && r.state === "live") verdict = `ok, a service (answers ${r.status} at /)`;
  else if (r.state === "parked" && r.refs > 0) verdict = `LINKED ${r.refs}x while parked`;
  else if (r.state === "staged") verdict = r.dns && r.status === 200 ? "staged, but already live (update hosts.json)" : "staged, awaiting deploy";
  else if (r.state === "live" && r.home === "none") verdict = "ok, no way home";
  if (/^(DOWN|LINKED)/.test(verdict)) bad++;
  r.verdict = verdict;
}
if (JSONOUT) console.log(JSON.stringify(rows, null, 2));
else {
  const w = Math.max(...rows.map(r => r.host.length));
  for (const r of rows) console.log(`${r.host.padEnd(w)}  ${r.state.padEnd(6)}  ${(r.dns ? String(r.status) : "no dns").padEnd(6)}  home:${(r.home || "-").padEnd(7)}  apex links:${String(r.refs).padStart(4)}  ${r.verdict}${r.title ? "  · " + r.title : ""}`);
  console.log(`\n${rows.length} hosts · ${rows.filter(r => r.verdict.startsWith("ok")).length} ok · ${rows.filter(r => r.state === "staged").length} staged · ${bad} need attention`);
}
process.exit(bad ? 1 : 0);
