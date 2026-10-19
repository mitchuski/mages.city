// Preview the community-site template locally against a live VTC: static files from ../website, live routes proxied.
//   node deploy/vti/vtc/bin/preview-website.mjs [--vtc https://vtc.mages.city] [--port 3340]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const VTC = arg('--vtc', 'https://vtc.mages.city'), PORT = +arg('--port', 3340);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../website');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const CSP = "default-src 'self'"; // what the daemon serves the website under
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/v1/') || u.pathname === '/health') {
    const body = req.method === 'POST' ? await new Promise(r => { let b = ''; req.on('data', c => b += c); req.on('end', () => r(b)); }) : undefined;
    try {
      const up = await fetch(VTC + u.pathname + u.search, { method: req.method, headers: { 'content-type': req.headers['content-type'] || 'application/json' }, body });
      res.writeHead(up.status, { 'content-type': up.headers.get('content-type') || 'application/octet-stream' });
      res.end(Buffer.from(await up.arrayBuffer()));
    } catch (e) { res.writeHead(502); res.end(String(e)); }
    return;
  }
  const p = path.join(ROOT, u.pathname === '/' ? 'index.html' : path.normalize(decodeURIComponent(u.pathname)).replace(/^[\/\\]+/, ''));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
  if (u.pathname === '/community.config.json') { // locally the live reads go through this proxy, not cross-origin
    const c = JSON.parse(fs.readFileSync(p, 'utf8')); c.api = '';
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(c)); return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'content-security-policy': CSP });
  fs.createReadStream(p).pipe(res);
}).listen(PORT, () => console.log(`community-site preview http://localhost:${PORT}  (live: ${VTC})`));
