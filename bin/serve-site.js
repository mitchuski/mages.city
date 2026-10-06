#!/usr/bin/env node
// bin/serve-site.js — zero-dep static server for the front (site/), the local stand-in for
// Cloudflare Workers assets. Mirrors the Workers "auto-trailing-slash" rule: /board serves
// board.html. No directory listings, no path escapes.
//   node bin/serve-site.js [port] [dir] [overlays]    (defaults 3334, ../site, none; overlays = dirs joined by path.delimiter, first hit wins)
// An overlay dir is served ahead of dir for the files it holds: the twin lays farm/front/ (the kit
// built with the twin's URLs) over site/, whose kit carries the production doors and is committed —
// then parked/ (the connected front, unpublished from site/ on 2026-09-14 until the farm is public).
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 3334;
const DIR = path.resolve(process.argv[3] || path.join(__dirname, '..', 'site'));
const OVERLAYS = process.argv[4] ? process.argv[4].split(path.delimiter).filter(Boolean).map(d => path.resolve(d)) : [];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.jsonc': 'application/json; charset=utf-8' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  let f = path.normalize(path.join(DIR, p));
  if (!f.startsWith(DIR)) { res.writeHead(403); return res.end('forbidden'); }
  for (const O of OVERLAYS) { // same auto-trailing-slash rule as below, so /connected/board finds parked/connected/board.html
    let o = path.normalize(path.join(O, p)); if (!o.startsWith(O)) continue;
    if (!fs.existsSync(o) && !path.extname(o) && fs.existsSync(o + '.html')) o += '.html';
    if (fs.existsSync(o) && fs.statSync(o).isFile()) { f = o; break; }
  }
  if (!fs.existsSync(f) && !path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
  fs.readFile(f, (err, buf) => {
    if (err || fs.statSync(f).isDirectory()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}).listen(PORT, () => console.log(`front on :${PORT} <- ${DIR}${OVERLAYS.map(o => ' + ' + o).join('')}`));
