#!/usr/bin/env node
// bin/serve-site.js — zero-dep static server for the front (site/), the local stand-in for
// Cloudflare Workers assets. Mirrors the Workers "auto-trailing-slash" rule: /board serves
// board.html. No directory listings, no path escapes.
//   node bin/serve-site.js [port] [dir] [overlay]     (defaults 3334, ../site, none)
// An overlay dir is served ahead of dir for the files it holds: the twin lays farm/front/ (the kit
// built with the twin's URLs) over site/, whose kit carries the production doors and is committed.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 3334;
const DIR = path.resolve(process.argv[3] || path.join(__dirname, '..', 'site'));
const OVERLAY = process.argv[4] ? path.resolve(process.argv[4]) : null;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.jsonc': 'application/json; charset=utf-8' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  let f = path.normalize(path.join(DIR, p));
  if (!f.startsWith(DIR)) { res.writeHead(403); return res.end('forbidden'); }
  if (OVERLAY) { const o = path.normalize(path.join(OVERLAY, p)); if (o.startsWith(OVERLAY) && fs.existsSync(o) && fs.statSync(o).isFile()) f = o; }
  if (!fs.existsSync(f) && !path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
  fs.readFile(f, (err, buf) => {
    if (err || fs.statSync(f).isDirectory()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}).listen(PORT, () => console.log(`front on :${PORT} <- ${DIR}${OVERLAY ? ' + ' + OVERLAY : ''}`));
