// deploy/pnm-console/serve.js — the two-seat pnm console's local server. Zero dependencies.
// Reads the VTAs through a WHITELIST of read-only `pnm … --json` calls (GET /api/state) and
// records the keeper's ceremony ledger (POST /ledger → ledger.json + ledger.log.jsonl).
// It never runs a mutating pnm command and never reads pnm's config or keyring:
// grants, deletes, setup and vault writes stay in the keeper's terminal.
// Local only; binds 127.0.0.1.
//   node deploy/pnm-console/serve.js [port]      (default 8799; PNM_BIN overrides the binary)
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const ROOT = __dirname;
const PORT = Number(process.argv[2] || 8799);
const PNM = process.env.PNM_BIN || path.join(os.homedir(), 'bin', process.platform === 'win32' ? 'pnm.exe' : 'pnm');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.png': 'image/png' };

// The only pnm calls this server will ever make. Each is a read.
const READS = {
  health:    ['health', '--json'],
  contexts:  ['contexts', 'list', '--json'],
  acl:       ['acl', 'list', '--json'],
  keys:      ['keys', 'list', '--json'],
  approvals: ['approvals', 'list', '--json'],
  audit:     ['audit', 'list', '--json'],
};
const SLUG = /^[a-z0-9][a-z0-9-]{0,40}$/;
// The terminal panel: named reads only. An argument is accepted only where the read takes one,
// and only in the shape given here. Nothing here can grant, delete, set up or write.
const TERMINAL = {
  'vta list':          { args: ['vta', 'list', '--json'], global: true },
  'vta info':          { args: ['vta', 'info', '--json'] },
  'health':            { args: ['health', '--json'] },
  'services list':     { args: ['services', 'list', '--json'] },
  'contexts list':     { args: ['contexts', 'list', '--json'] },
  'acl list':          { args: ['acl', 'list', '--json'] },
  'keys list':         { args: ['keys', 'list', '--json'] },
  'did-mgmt dids list':{ args: ['did-mgmt', 'dids', 'list', '--json'] },
  'approvals list':    { args: ['approvals', 'list', '--json'] },
  'approvals explain': { args: ['approvals', 'explain'], arg: /^https:\/\/trusttasks\.org\/spec\/[a-z0-9/._-]{3,120}$/ },
  'audit list':        { args: ['audit', 'list', '--json'] },
  'audit verify':      { args: ['audit', 'verify', '--json'] },
};
// Only this page may call the API: the Host must be loopback (defeats DNS rebinding) and a
// browser request must carry this origin (defeats a hostile page POSTing to 127.0.0.1).
function sameOrigin(req) {
  const host = String(req.headers.host || '');
  if (host !== '127.0.0.1:' + PORT && host !== 'localhost:' + PORT) return false;
  const o = req.headers.origin; if (o && o !== 'http://' + host) return false;
  const site = req.headers['sec-fetch-site']; if (site && site !== 'same-origin' && site !== 'none') return false;
  return true;
}

function pnm(args, timeout = 25000) {
  return new Promise(resolve => {
    execFile(PNM, args, { timeout, windowsHide: true, maxBuffer: 8 << 20, env: { ...process.env, NO_COLOR: '1' } }, (err, stdout, stderr) => {
      let json = null; try { json = JSON.parse(stdout); } catch (_) {}
      resolve({ ok: !err, code: err ? (err.code ?? 1) : 0, json, error: err ? String(stderr || err.message).trim().slice(-600) : null });
    });
  });
}

async function seat(slug) {
  const out = { slug, at: new Date().toISOString() };
  out.health = await pnm(['-v', slug, ...READS.health]);
  if (!out.health.ok) return out;                      // a dead VTA gets no further reads
  const names = ['contexts', 'acl', 'keys', 'approvals', 'audit'];
  const res = await Promise.all(names.map(n => pnm(['-v', slug, ...READS[n]])));
  names.forEach((n, i) => { out[n] = res[i]; });
  return out;
}

async function state() {
  const list = await pnm(['vta', 'list', '--json'], 10000);
  const vtas = Array.isArray(list.json) ? list.json : [];
  const seats = await Promise.all(vtas.filter(v => SLUG.test(v.slug || '')).map(v => seat(v.slug)));
  return { at: new Date().toISOString(), pnm: PNM, pnmFound: fs.existsSync(PNM), list, seats };
}

// The ledger holds DIDs, key types, dates and ticks — never secrets.
function refuseSecrets(v, where = 'ledger') {
  if (typeof v === 'string') {
    if (v.length > 400) throw new Error(where + ': value too long for a ledger field');
    if (v.trim().split(/\s+/).length >= 12) throw new Error(where + ': looks like a mnemonic — never record one here');
    if (/BEGIN [A-Z ]*PRIVATE|"d"\s*:|privateKey/i.test(v)) throw new Error(where + ': looks like private key material');
  } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) refuseSecrets(x, where + '.' + k);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
  if ((url.pathname.startsWith('/api/') || url.pathname === '/ledger') && !sameOrigin(req)) return send(403, { ok: false, error: 'local page only' });
  if (url.pathname === '/api/terminal' && req.method === 'GET') return send(200, { reads: Object.keys(TERMINAL) });
  if (url.pathname === '/api/run' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
    req.on('end', async () => {
      try {
        const j = JSON.parse(body), t = TERMINAL[j.read];
        if (!t) return send(400, { ok: false, error: 'not a whitelisted read: ' + j.read });
        const args = [];
        if (!t.global) { if (!SLUG.test(j.slug || '')) return send(400, { ok: false, error: 'bad slug' }); args.push('-v', j.slug); }
        args.push(...t.args);
        if (t.arg) { if (!t.arg.test(j.arg || '')) return send(400, { ok: false, error: 'argument not in the allowed shape' }); args.push(j.arg); }
        const r = await pnm(args);
        send(200, { ...r, cmd: 'pnm ' + args.join(' ') });
      } catch (e) { send(400, { ok: false, error: String(e.message) }); }
    });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/state') {
    try { return send(200, await state()); } catch (e) { return send(500, { ok: false, error: String(e.message) }); }
  }
  if (url.pathname === '/ledger') {
    const p = path.join(ROOT, 'ledger.json');
    if (req.method === 'GET') return fs.existsSync(p) ? send(200, JSON.parse(fs.readFileSync(p, 'utf8'))) : send(404, { ok: false });
    if (req.method === 'POST') {
      let body = '';
      req.on('data', c => { body += c; if (body.length > 65536) req.destroy(); });
      req.on('end', () => {
        try {
          const j = JSON.parse(body);
          const rec = { at: new Date().toISOString(), seats: j.seats || {}, done: j.done || [], notes: j.notes || '' };
          refuseSecrets(rec);
          fs.writeFileSync(p, JSON.stringify(rec, null, 2) + '\n');
          fs.appendFileSync(path.join(ROOT, 'ledger.log.jsonl'), JSON.stringify(rec) + '\n');
          send(200, { ok: true, at: rec.at });
        } catch (e) { send(400, { ok: false, error: String(e.message) }); }
      });
      return;
    }
  }
  let rel = decodeURIComponent(url.pathname); if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT) || /ledger\.log/.test(file) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
server.listen(PORT, '127.0.0.1', () => console.log('pnm console on http://127.0.0.1:' + PORT + '/  (reads via ' + PNM + ')'));
