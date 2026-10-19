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

// 2026-10-19: the nav is a visitor's path to deciding (keeper: "the navigation is kinda strange and doesn't show all
// the items … make ux better for a human checking if they should become a mage and join"). Every page is reachable
// from every page: the journey links inline, all nine places + the workshop pages in one panel (The City ▾), one CTA.
// The panel is a <details> that overlays the content, so opening it moves nothing; nav.js only closes it.
const places = JSON.parse(fs.readFileSync(path.join(SITE, 'places.json'), 'utf8'));
const PLACES = (places.places || places);
const JOURNEY = [
  ['Become', 'become.html'],
  ['Guide', 'guide.html'],
  ['Evidence', 'arena.html'],
  ['For your city', 'found.html'],
];
const WORKSHOP = [
  ['🔭', 'Routes', 'discover.html', 'Routes through the City by purpose.'],
  ['✍️', 'Contribute', 'board.html', 'The board: speak, reply, open a thread.'],
  ['🔗', 'Connect', 'join.html', 'The OpenVTC join, step by step.'],
  ['🪪', 'Your space', 'space.html', 'What you hold, once you are in.'],
];
// the hash challenges: one public site per hash, the work played as music, its evidence chain shown as roots
const HASHES = [
  ['SHA-256', 'https://sha256.mages.city/'],
  ['SHA-3', 'https://sha3.mages.city/'],
  ['BLAKE3', 'https://blake3.mages.city/'],
  ['Poseidon', 'https://poseidon.mages.city/'],
];
const JOIN = 'https://join.mages.city/';
const here = (file, href) => href.split('#')[0] === file;

export function headerFor(file) {
  const cur = href => here(file, href) ? ' aria-current="page"' : '';
  const journey = JOURNEY.map(([label, href]) => `<a href="${href}"${cur(href)}>${esc(label)}</a>`).join('');
  const item = (glyph, name, href, line) =>
    `<a class="menu-item" href="${esc(href)}"${cur(href)}><span class="menu-glyph${[...glyph].length > 2 ? ' menu-glyph-wide' : ''}" aria-hidden="true">${esc(glyph)}</span><span><b>${esc(name)}</b><small>${esc(line)}</small></span></a>`;
  const GROUPS = places.groups || [{ id: undefined, name: '' }];
  const placeItems = GROUPS.map(g => {
    const ps = PLACES.filter(p => g.id === undefined || p.group === g.id);
    return (g.name ? `<p class="menu-sub">${esc(g.name)}</p>` : '') + ps.map(p => item(p.glyph, p.name.replace(/^the /, 'The '), p.door, p.line)).join('');
  }).join('');
  const workshopItems = WORKSHOP.map(w => item(...w)).join('');
  const hashItems = `<p class="menu-sub">Hash challenges</p><div class="menu-hashes">${HASHES.map(([n, u]) => `<a href="${u}">${esc(n)} ↗</a>`).join('')}</div><a class="menu-more" href="arena.html#arenas">every arena and its evidence chain →</a>`;
  const inCity = PLACES.some(p => here(file, p.door)) || WORKSHOP.some(w => here(file, w[2]));
  const panel = `<div class="menu-panel"><div class="menu-col menu-journey"><p class="menu-h">Start here</p>${item('🧙', 'Become a mage', 'become.html', 'Who the City is for, what you do, what you hold.')}${item('🌱', 'Give your city a mage', 'found.html', 'Found your trust community, with a mage at its side.')}</div><div class="menu-col"><p class="menu-h">The places</p>${placeItems}</div><div class="menu-col"><p class="menu-h">Workshop</p>${workshopItems}${hashItems}<a class="menu-join" href="${JOIN}">Join the community →</a></div></div>`;
  const nav = `<nav aria-label="Main" class="city-nav"><a class="brand" href="index.html"${cur('index.html')}><span aria-hidden="true">&#x1F9D9;</span> mages.city</a><div class="links"><span class="journey">${journey}</span><details class="city-menu"><summary${inCity ? ' aria-current="page"' : ''}><span class="menu-wide">Discover</span><span class="menu-narrow">Menu</span></summary>${panel}</details><a class="join-cta" href="${JOIN}">Join →</a></div></nav><script src="nav.js" defer></script>`;
  const band = did
    ? `<div class="city-band" id="band"><span class="band-dot" aria-hidden="true">●</span> minted ${esc(community.minted || '')} · <strong id="city-did" title="${esc(did)}">${esc(short)}</strong>${community.administration ? ' · administered from a Star' : ''} · <a href="https://join.mages.city/">get in</a> · <a href="community.md">terms</a></div>`
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
