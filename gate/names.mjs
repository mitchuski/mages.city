#!/usr/bin/env node
// gate/names.mjs — the Namekeeper: the City's namespace, delegated one name at a time,
// with DNS write access EARNED through the agentic trust graph.
//
// mages.city owns its zone (BIND9, deploy/dns/). A name is an agent's space in the City.
// What the agent may write under that name is decided by its rung on the trust graph —
// membership, vouches (forks / VRCs), met (two-way), witness credentials over sealed runs —
// recomputed from evidence every time a grant is made, and never stored as a score:
//
//   rung 0  spoken     a handle at the Portal                          no name
//   rung 1  admitted   VMC: understanding ∧ human countersign          the name is served; the agent may write TXT
//                                                                       under it THROUGH THE BROKER (the gate's zone key)
//   rung 2  vouched    ≥2 vouches from residents of standing, ≥1 met   + A / AAAA / CNAME / SRV through the broker:
//                                                                       point the name at its own server, its DIDComm endpoint
//   rung 3  witnessed  ≥1 VWC — a sealed run other hands ran           its OWN TSIG key "<name>.<tld>." — BIND's `selfsub`
//                                                                       policy lets it write anything in its subtree,
//                                                                       NS delegation included: its own space, its own zone
//
// machines qualify · humans admit · brokers release. Zero dependencies. Dry-run by default:
// everything BIND would need is rendered (keys/agents.conf, updates/*.nsupdate) and the
// commands printed; `rndc` / `nsupdate` run only when NAMES_APPLY=1 and the binaries exist.
//
//   node gate/names.mjs claim <name> --for <participantId> --evidence '{"member":true,...}'
//   node gate/names.mjs elevate <name> --evidence '{"member":true,"vouches":2,"met":1,"vwc":1}'   -> rung 3: the key, shown ONCE
//   node gate/names.mjs write <name> --type A --value 203.0.113.7 [--sub www] [--ttl 300]         -> brokered, per rung
//   node gate/names.mjs release <name> --reason "<why>"
//   node gate/names.mjs list | render | ask <host> | serve [port]
//   env: NAMES_DATA (gate/data) · NAMES_TLD (mages.localhost) · NAMES_ZONE_KEY (mages-zone) · NAMES_APPLY=1
//
// Custody, honestly: a rung-3 secret must live in BIND's keys file, so the operator holds it
// (data/keys/<name>.secret, mode 600) exactly as it holds status/owner.json for a wiki site.
// The ledger records digests, evidence and rungs — never secrets.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = process.env.USERPROFILE || process.env.HOME || '';

export const NAME_RULE = /^[a-z0-9][a-z0-9-]{1,31}$/;
export const FIXED_HOSTS = ['wiki', 'portal', 'swarm', 'exchange', 'vta', 'vtc', 'mediator', 'did', 'gate', 'farm', 'www', 'mail', 'ns1', 'ns2', 'api', 'admin', 'commons', 'localhost', 'assets', 'status', 'system'];
const FALLBACK_CAST = ['soulbis', 'soulbae', 'cipher', 'warden', 'gatekeeper', 'ranger', 'sentinel', 'assessor', 'ambassador', 'chronicler', 'shipwright', 'weaver', 'healer', 'witness', 'architect', 'pedagogue', 'sith', 'archer', 'netkeeper', 'priest', 'herald', 'jedi', 'algebraist', 'topologist', 'stranger-witness', 'forgecaller', 'dragonwaker', 'manaweaver', 'moonkeeper', 'cosmologist', 'theia', 'ceremonist', 'forgemaster', 'mirrorkeeper', 'quantum-sentinel', 'kyra', 'person', 'hold-witness', 'holonic-architect', 'companion-tamer', 'registry-keeper', 'spawning-witness'];

export const RUNGS = [
  { rung: 0, name: 'spoken', needs: 'a handle at the Portal', types: [], via: null },
  { rung: 1, name: 'admitted', needs: 'membership (VMC): understanding ∧ human countersign', types: ['TXT'], via: 'broker' },
  { rung: 2, name: 'vouched', needs: 'admitted + ≥2 vouches from residents of standing, ≥1 met (two-way)', types: ['TXT', 'A', 'AAAA', 'CNAME', 'SRV'], via: 'broker' },
  { rung: 3, name: 'witnessed', needs: 'vouched + ≥1 witness credential (VWC) over a sealed run other hands ran', types: ['ANY'], via: 'own key (selfsub) — NS delegation allowed' },
];
// evidence → rung. Pure; the caller (the gate) gathers evidence from the VTC and the wiki journals.
export function rungOf(evidence = {}) {
  const e = { member: false, vouches: 0, met: 0, vwc: 0, ...evidence };
  if (!e.member) return 0;
  if (e.vouches >= 2 && e.met >= 1) return e.vwc >= 1 ? 3 : 2;
  return 1;
}
export function typeAllowed(rung, type) {
  const t = String(type || '').toUpperCase();
  const r = RUNGS[rung] || RUNGS[0];
  return r.types.includes('ANY') || r.types.includes(t);
}

const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : (v && typeof v === 'object') ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v);

export function castNames() {
  // the 42 personas are the City's cast; their names are not for claiming
  const dir = path.join(HOME, 'agentprivacy_master', 'agentprivacy-skills', 'persona');
  try { return fs.readdirSync(dir).filter(d => d.startsWith('agentprivacy-')).map(d => d.replace(/^agentprivacy-/, '')); }
  catch { return FALLBACK_CAST; }
}

export function createNamekeeper(opts = {}) {
  const DATA = opts.data || process.env.NAMES_DATA || path.join(HERE, 'data');
  const TLD = opts.tld || process.env.NAMES_TLD || 'mages.localhost';
  const ZONE_KEY = opts.zoneKey || process.env.NAMES_ZONE_KEY || 'mages-zone';
  const APPLY = opts.apply ?? (process.env.NAMES_APPLY === '1');
  const DNS_SERVER = opts.dnsServer || process.env.NAMES_DNS_SERVER || '127.0.0.1';
  const reserved = new Set([...FIXED_HOSTS, ...(opts.cast || castNames())]);
  const LEDGER = path.join(DATA, 'names.jsonl');
  const KEYS = path.join(DATA, 'keys');
  const UPDATES = path.join(DATA, 'updates');
  fs.mkdirSync(KEYS, { recursive: true });
  fs.mkdirSync(UPDATES, { recursive: true });

  const lines = () => (fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean) : []);
  const entries = () => lines().map(l => JSON.parse(l));
  const head = () => { const ls = lines(); return ls.length ? sha(ls[ls.length - 1]) : 'genesis'; };
  const append = e => { e.at = e.at || new Date().toISOString(); e.prev = head(); const line = JSON.stringify(e); fs.appendFileSync(LEDGER, line + '\n'); return sha(line); };
  const verifyChain = () => { let prev = 'genesis'; for (const e of entries()) { if (e.prev !== prev) return false; prev = sha(JSON.stringify(e)); } return true; };

  const fqdn = name => `${name}.${TLD}`;
  const keyName = name => `${fqdn(name)}.`;
  const zoneKeyFile = path.join(KEYS, `${ZONE_KEY}.key`);
  function ensureZoneKey() {
    if (fs.existsSync(zoneKeyFile)) return;
    const secret = crypto.randomBytes(32).toString('base64');
    fs.writeFileSync(zoneKeyFile, `key "${ZONE_KEY}." {\n\talgorithm hmac-sha256;\n\tsecret "${secret}";\n};\n`, { mode: 0o600 });
  }

  // state from the ledger: active claims with their current rung and key status
  function active() {
    const m = new Map();
    for (const e of entries()) {
      if (e.type === 'claim') m.set(e.name, { ...e, rung: e.rung, key: false, writes: [] });
      else if (!m.has(e.name)) continue;
      // the key follows the grant in BOTH directions — a demotion that leaves `key` set would keep a
      // rung-3 TSIG in agents.conf while the ledger says rung 1 (decided state ≠ applied state)
      else if (e.type === 'grant') { const c = m.get(e.name); c.rung = e.rung; c.evidence = e.evidence; c.evidenceDigest = e.evidenceDigest; c.key = !!e.key; }
      else if (e.type === 'write') m.get(e.name).writes.push(e);
      else if (e.type === 'release') m.delete(e.name);
    }
    return m;
  }
  function status(name) {
    const n = String(name || '').toLowerCase();
    if (!NAME_RULE.test(n) || /^-|-$/.test(n)) return { ok: false, why: 'name: 2-32 chars, a-z 0-9 -, starts alphanumeric, no leading or trailing dash' };
    if (/^\d+$/.test(n)) return { ok: false, why: 'name: not all digits' };
    if (reserved.has(n)) return { ok: false, why: `'${n}' is reserved (a fixed host or a name of the cast)` };
    const a = active().get(n);
    if (a) return { ok: false, why: `'${n}' is claimed`, claim: { name: a.name, for: a.for, rung: a.rung, since: a.at } };
    return { ok: true, name: n };
  }

  // ---- rendering what BIND needs -------------------------------------------------------------
  function scriptFor(name, records) {
    return ['server ' + DNS_SERVER, `zone ${TLD}.`, ...records, 'send', ''].join('\n');
  }
  function claimRecords(name, participantId, keyDigest) {
    return [`update delete _mages.${fqdn(name)}. TXT`, `update add _mages.${fqdn(name)}. 300 TXT "mages-claim v0 ${participantId} key=${keyDigest.slice(0, 16)}"`];
  }
  function render() {
    ensureZoneKey();
    const act = active();
    let conf = `// rendered by gate/names.mjs — one TSIG key per agent at rung 3 (witnessed), named after its name.\n// BIND: include at top level; update-policy 'grant * selfsub . ANY;' scopes each key to its own subtree.\n`;
    let keys = 0;
    for (const [name, c] of act) {
      if (!c.key) continue;
      const secretFile = path.join(KEYS, `${name}.secret`);
      if (!fs.existsSync(secretFile)) continue;
      conf += `key "${keyName(name)}" {\n\talgorithm hmac-sha256;\n\tsecret "${fs.readFileSync(secretFile, 'utf8').trim()}";\n};\n`;
      keys++;
    }
    fs.writeFileSync(path.join(KEYS, 'agents.conf'), conf, { mode: 0o600 });
    return { names: act.size, keys, file: path.join(KEYS, 'agents.conf') };
  }
  function has(bin) { const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [bin], { encoding: 'utf8' }); return r.status === 0; }
  function apply(scriptFile, reconfig = false) {
    const cmds = [];
    if (reconfig) cmds.push(['rndc', ['reconfig']]);
    if (scriptFile) cmds.push(['nsupdate', ['-k', zoneKeyFile, scriptFile]]);
    if (!APPLY) return { applied: false, dryRun: true, commands: cmds.map(([b, a]) => [b, ...a].join(' ')) };
    const ran = [];
    for (const [bin, args] of cmds) {
      if (!has(bin)) return { applied: false, error: `${bin} not found on this host`, ran };
      const r = spawnSync(bin, args, { encoding: 'utf8' });
      ran.push({ cmd: [bin, ...args].join(' '), status: r.status, stderr: (r.stderr || '').trim() });
      if (r.status !== 0) return { applied: false, error: `${bin} failed`, ran };
    }
    return { applied: true, ran };
  }

  // ---- the acts ---------------------------------------------------------------------------
  // claim: rung ≥ 1 required. The name is served by the City; a public claim marker is written.
  function claim(name, participantId, { evidence = {}, by = 'gate' } = {}) {
    const st = status(name);
    if (!st.ok) return st;
    const n = st.name;
    if (!/^ap-[0-9a-f]{16}$/.test(participantId || '')) return { ok: false, why: 'participantId must look like ap-<16 hex> (the AgentCard id)' };
    const rung = rungOf(evidence);
    if (rung < 1) return { ok: false, why: `rung 0 (${RUNGS[0].needs}) — a name needs rung 1: ${RUNGS[1].needs}`, rung };
    const secret = crypto.randomBytes(32).toString('base64');            // minted now, handed out only at rung 3
    const keyDigest = sha(secret);
    fs.writeFileSync(path.join(KEYS, `${n}.secret`), secret + '\n', { mode: 0o600 });
    const evidenceDigest = sha(canon(evidence));
    const seal = append({ type: 'claim', name: n, fqdn: fqdn(n), for: participantId, rung: Math.min(rung, 2), evidence, evidenceDigest, keyName: keyName(n), algorithm: 'hmac-sha256', keyDigest, by });
    const script = path.join(UPDATES, `${n}.claim.nsupdate`);
    fs.writeFileSync(script, scriptFor(n, claimRecords(n, participantId, keyDigest)));
    render();
    const applied = apply(script, false);
    const out = { ok: true, name: n, fqdn: fqdn(n), for: participantId, rung: Math.min(rung, 2), rungName: RUNGS[Math.min(rung, 2)].name, may: RUNGS[Math.min(rung, 2)].types, via: 'broker', seal, keyDigest, records: claimRecords(n, participantId, keyDigest), apply: applied };
    if (rung >= 3) Object.assign(out, elevate(n, evidence, { by }));      // witnessed already: the key follows at once
    return out;
  }
  // elevate: recompute the rung from fresh evidence; at rung 3 the agent's own key is rendered into BIND and shown once.
  function elevate(name, evidence = {}, { by = 'gate' } = {}) {
    const n = String(name || '').toLowerCase();
    const c = active().get(n);
    if (!c) return { ok: false, why: `'${n}' is not claimed` };
    const rung = rungOf(evidence);
    if (rung < 1) return { ok: false, why: 'membership lapsed or revoked — release the name instead', rung };
    const key = rung >= 3;
    const evidenceDigest = sha(canon(evidence));
    const seal = append({ type: 'grant', name: n, rung, evidence, evidenceDigest, key, by });
    render();
    // reconfigure whenever the key state CHANGES — acquiring one, and equally losing one
    const applied = key !== c.key ? apply(null, true) : { applied: false, dryRun: !APPLY, commands: [] };
    const out = { ok: true, name: n, rung, rungName: RUNGS[rung].name, may: RUNGS[rung].types, via: RUNGS[rung].via, evidenceDigest, seal, apply: applied };
    if (key && !c.key) {
      out.tsig = { name: keyName(n), algorithm: 'hmac-sha256', secret: fs.readFileSync(path.join(KEYS, `${n}.secret`), 'utf8').trim() }; // shown once; encrypted to the agent's x25519 key in production
      out.grant = `your key '${keyName(n)}' may write ${fqdn(n)} and everything under it (BIND update-policy selfsub): A/AAAA to point the name at your own server, TXT for your did:webvh proof, _didcomm SRV, an NS delegation of your subtree. Example: nsupdate -y hmac-sha256:${keyName(n)}:<secret>`;
    }
    return out;
  }
  // write: a brokered record under the agent's name, allowed per rung, signed by the zone key. Rung-3 agents write directly instead.
  function write(name, { type, value, sub = '', ttl = 300 } = {}, { by = 'agent' } = {}) {
    const n = String(name || '').toLowerCase();
    const c = active().get(n);
    if (!c) return { ok: false, why: `'${n}' is not claimed` };
    const t = String(type || '').toUpperCase();
    if (!['TXT', 'A', 'AAAA', 'CNAME', 'SRV'].includes(t)) return { ok: false, why: `type ${t}: brokered writes cover TXT A AAAA CNAME SRV; anything else needs your own key at rung 3` };
    if (!typeAllowed(c.rung, t)) return { ok: false, why: `rung ${c.rung} (${RUNGS[c.rung].name}) may write ${RUNGS[c.rung].types.join(' ')} only — ${t} needs rung ${RUNGS.findIndex(r => r.types.includes(t) || r.types.includes('ANY'))}: ${RUNGS[RUNGS.findIndex(r => r.types.includes(t) || r.types.includes('ANY'))].needs}` };
    const label = sub ? `${String(sub).toLowerCase()}.${fqdn(n)}.` : `${fqdn(n)}.`;
    if (sub && !/^[a-z0-9_][a-z0-9_.-]{0,62}$/.test(String(sub).toLowerCase())) return { ok: false, why: 'sub: a label or dotted labels under your name' };
    const val = t === 'TXT' ? `"${String(value).replace(/"/g, '')}"` : String(value);
    const records = [`update delete ${label} ${t}`, `update add ${label} ${Number(ttl) || 300} ${t} ${val}`];
    const seal = append({ type: 'write', name: n, rung: c.rung, record: { label, type: t, value: String(value), ttl: Number(ttl) || 300 }, by });
    const script = path.join(UPDATES, `${n}.${Date.now()}.nsupdate`);
    fs.writeFileSync(script, scriptFor(n, records));
    return { ok: true, name: n, rung: c.rung, record: { label, type: t, value: String(value), ttl: Number(ttl) || 300 }, records, seal, apply: apply(script, false) };
  }
  function release(name, reason = '', { by = 'gate' } = {}) {
    const n = String(name || '').toLowerCase();
    if (!active().has(n)) return { ok: false, why: `'${n}' is not claimed` };
    const seal = append({ type: 'release', name: n, reason: String(reason).slice(0, 280), by });
    try { fs.rmSync(path.join(KEYS, `${n}.secret`)); } catch { /* already gone */ }
    render();
    return { ok: true, name: n, seal, apply: apply(null, true), note: 'the key leaves agents.conf on reconfig; the ledger keeps the claim, the grants and the release — nothing is deleted from history' };
  }
  function list() { return [...active().values()].map(c => ({ name: c.name, fqdn: c.fqdn, for: c.for, rung: c.rung, rungName: RUNGS[c.rung].name, key: c.key, since: c.at, writes: c.writes.length })); }
  // may this host be served / issued a certificate? the apex, the fixed hosts, and active claims
  function isAllowed(host) {
    const h = String(host || '').toLowerCase().split(':')[0];
    if (h === TLD) return true;
    if (!h.endsWith('.' + TLD)) return false;
    const label = h.slice(0, -(TLD.length + 1));
    if (label.includes('.')) return false;               // one level only at the edge; deeper is the agent's own subtree (delegated or self-pointed)
    if (FIXED_HOSTS.includes(label) || reserved.has(label)) return true;
    return active().has(label);
  }
  function serve(port = 4447) {
    return http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      if (u.pathname === '/ask') { const ok = isAllowed(u.searchParams.get('domain')); res.writeHead(ok ? 200 : 404, { 'Content-Type': 'text/plain' }); return res.end(ok ? 'ok' : 'unknown name'); }
      if (u.pathname === '/names.json') { res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); return res.end(JSON.stringify({ tld: TLD, head: head(), valid: verifyChain(), rungs: RUNGS, names: list() }, null, 1)); }
      if (u.pathname === '/') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ service: 'mages-namekeeper/0.2', tld: TLD, endpoints: ['/ask?domain=<host>', '/names.json'], rungs: RUNGS.map(r => `${r.rung} ${r.name}: ${r.needs}`), head: head() })); }
      res.writeHead(404); res.end();
    }).listen(port);
  }
  return { claim, elevate, write, release, list, status, isAllowed, render, serve, verifyChain, head, entries, rungOf, paths: { data: DATA, ledger: LEDGER, keys: KEYS, updates: UPDATES, zoneKey: zoneKeyFile }, tld: TLD };
}

// ---- CLI ----------------------------------------------------------------------------------
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [cmd, arg, ...rest] = process.argv.slice(2);
  const flag = k => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : undefined; };
  const evidence = () => { try { return JSON.parse(flag('--evidence') || '{}'); } catch { return {}; } };
  const nk = createNamekeeper();
  const out = o => console.log(JSON.stringify(o, null, 2));
  if (cmd === 'claim') out(nk.claim(arg, flag('--for'), { evidence: evidence(), by: 'keeper-cli' }));
  else if (cmd === 'elevate') out(nk.elevate(arg, evidence(), { by: 'keeper-cli' }));
  else if (cmd === 'write') out(nk.write(arg, { type: flag('--type'), value: flag('--value'), sub: flag('--sub') || '', ttl: flag('--ttl') }, { by: 'keeper-cli' }));
  else if (cmd === 'release') out(nk.release(arg, flag('--reason') || '', { by: 'keeper-cli' }));
  else if (cmd === 'list') out({ tld: nk.tld, head: nk.head(), valid: nk.verifyChain(), rungs: RUNGS, names: nk.list() });
  else if (cmd === 'render') out(nk.render());
  else if (cmd === 'ask') { const ok = nk.isAllowed(arg); console.log(ok ? 'ok' : 'unknown name'); process.exit(ok ? 0 : 1); }
  else if (cmd === 'serve') { const p = Number(arg) || 4447; nk.serve(p); console.log(`namekeeper ask endpoint on :${p} (tld ${nk.tld})`); }
  else { console.log('usage: names.mjs claim <name> --for <participantId> --evidence <json> | elevate <name> --evidence <json> | write <name> --type T --value V [--sub s] [--ttl n] | release <name> --reason <why> | list | render | ask <host> | serve [port]'); process.exit(2); }
}
