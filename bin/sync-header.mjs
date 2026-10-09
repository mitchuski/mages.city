// bin/sync-header.mjs — one header for every page. Writes the same nav and the same status band into
// every site/*.html at build time, so the first paint is already final: nothing is injected or rewritten
// after load, and moving between pages never moves the header. Run after editing places.json,
// community.json or any page's top:  node bin/sync-header.mjs   (verify.mjs checks the result).
//
// The band's text is baked from community.json; status.js only confirms it (title attribute), never
// re-renders it. The current page is marked with aria-current, which changes no layout.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const community = JSON.parse(fs.readFileSync(path.join(SITE, 'community.json'), 'utf8'));
const did = community.communityDid;
const short = did ? did.replace(/^(did:webvh:[A-Za-z0-9]{8})[A-Za-z0-9]+(:.*)$/, '$1…$2') : null;

const LINKS = [
  ['Places', 'index.html#places', ['index.html']],
  ['Spellbook', 'spellbooks.html', ['spellbooks.html']],
  ['Join', 'starkey.md', ['join.html']],
];

export function headerFor(file) {
  const links = LINKS.map(([label, href, pages]) =>
    `<a href="${href}"${pages.includes(file) ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const nav = `<nav aria-label="Main" class="city-nav"><a class="brand" href="index.html"><span aria-hidden="true">&#x1F9D9;</span> mages.city</a><div class="links">${links}</div></nav>`;
  const band = did
    ? `<div class="city-band" id="band"><span class="band-dot" aria-hidden="true">●</span> minted ${esc(community.minted || '')} · <strong id="city-did" title="${esc(did)}">${esc(short)}</strong>${community.administration ? ' · administered from a Star' : ''} · <a href="starkey.md">get in</a> · <a href="community.md">terms</a></div>`
    : `<div class="city-band" id="band"><span class="band-dot band-dot-off" aria-hidden="true">●</span> community DID: <strong id="city-did">not yet minted</strong> · <a href="community.md">terms</a></div>`;
  return `<!--city-header-->${nav}${band}<!--/city-header-->`;
}

// remove any earlier header: a marked block, a Main nav, and old status notices directly after it
const OLD_NAV = /<nav aria-label="Main"[^>]*>[\s\S]*?<\/nav>/;
const OLD_BAND = /\s*<div class="notice city-status"[^>]*>[\s\S]*?<\/div>/;
const MARKED = /<!--city-header-->[\s\S]*?<!--\/city-header-->/;

export function sync({ write = true } = {}) {
  const changed = [];
  for (const file of fs.readdirSync(SITE).filter(f => f.endsWith('.html') && f !== '404.html')) {
    const p = path.join(SITE, file);
    let s = fs.readFileSync(p, 'utf8');
    const before = s;
    const header = headerFor(file);
    if (MARKED.test(s)) {
      s = s.replace(MARKED, header);
    } else if (OLD_NAV.test(s)) {
      s = s.replace(OLD_NAV, header);
      const at = s.indexOf('<!--/city-header-->') + '<!--/city-header-->'.length;
      const rest = s.slice(at);
      const m = rest.match(OLD_BAND);
      if (m && m.index === 0) s = s.slice(0, at) + rest.slice(m[0].length);
    } else if (s.includes('<div class="wrap">')) {
      s = s.replace('<div class="wrap">', '<div class="wrap">' + header);
    } else continue;
    if (s !== before) { changed.push(file); if (write) fs.writeFileSync(p, s); }
  }
  return changed;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const changed = sync();
  console.log(changed.length ? `header synced: ${changed.join(', ')}` : 'header already in sync');
}
