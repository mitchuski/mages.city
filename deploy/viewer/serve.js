// deploy/viewer/serve.js — the stand-up reader's local server. Zero dependencies.
// Serves this directory and accepts POST /decisions: the reader autosaves the keeper's
// choices and ticks here, so they land in the repo (decisions.json + decisions.log.jsonl)
// instead of living only in one browser's localStorage. Local only; binds 127.0.0.1.
//   node deploy/viewer/serve.js [port]      (default 8792)
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const PORT = Number(process.argv[2] || 8792);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (req.method === 'POST' && url.pathname === '/decisions') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 65536) req.destroy(); });
    req.on('end', () => {
      try {
        const j = JSON.parse(body);
        const rec = { at: new Date().toISOString(), choices: j.choices || {}, done: j.done || [] };
        fs.writeFileSync(path.join(ROOT, 'decisions.json'), JSON.stringify(rec, null, 2) + '\n');
        fs.appendFileSync(path.join(ROOT, 'decisions.log.jsonl'), JSON.stringify(rec) + '\n');
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, at: rec.at }));
      } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: String(e.message) })); }
    });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/decisions') {
    const p = path.join(ROOT, 'decisions.json');
    if (!fs.existsSync(p)) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"ok":false}'); }
    res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(fs.readFileSync(p));
  }
  let rel = decodeURIComponent(url.pathname); if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
server.listen(PORT, '127.0.0.1', () => console.log('stand-up reader on http://127.0.0.1:' + PORT + '/  (POST /decisions records to decisions.json)'));
