// site/data.js — the front's data layer. A plain ES module: the browser imports it, and
// bin/verify.mjs imports the same file in node with an injected fetch, so what the front
// shows is exactly what the acceptance check checks. Everything here is read from the
// wiki farm's JSON and the Portal desk; nothing is stored, nothing is scored.

export function parseRoster(text) {
  const out = { categories: {}, all: [] };
  let cat = 'sites';
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)(:\d+)?$/.test(line) || /^localhost(:\d+)?$/.test(line)) {
      (out.categories[cat] ||= []).push(line);
      out.all.push(line);
    } else if (/^(ROSTER|REFERENCES) /.test(line)) {
      continue;
    } else {
      cat = line;
    }
  }
  return out;
}

export function createClient(cfg, fetchFn = (...a) => globalThis.fetch(...a)) {
  const j = async (url, opts = {}) => {
    const r = await fetchFn(url, { ...opts, headers: { Accept: 'application/json', ...(opts.headers || {}) } });
    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* not json */ }
    return { ok: r.ok, status: r.status, data };
  };
  const site = host => cfg.site(host);
  const codeItem = page => {
    const it = (page?.story || []).find(i => i.type === 'code');
    try { return it ? JSON.parse(it.text) : null; } catch { return null; }
  };
  const client = {
    async roster() {
      const r = await j(`${cfg.wiki}/the-roster.json`);
      const item = (r.data?.story || []).find(i => i.type === 'roster');
      const parsed = parseRoster(item?.text || '');
      return { residents: parsed.categories['mages residents'] || [], districts: parsed.categories['mages districts'] || [], all: parsed.all };
    },
    async sitemap(host) {
      const r = await j(`${site(host)}/system/sitemap.json`);
      return Array.isArray(r.data) ? r.data : [];
    },
    async page(host, slug) {
      const r = await j(`${site(host)}/${slug}.json`);
      return r.ok ? r.data : null;
    },
    // the live feed: every roster site's sitemap, merged, same-titled pages grouped as a thread
    async feed(hosts, { limit = 50, since = 0 } = {}) {
      const rows = [];
      await Promise.all(hosts.map(async h => {
        for (const p of await client.sitemap(h)) {
          if ((p.date || 0) < since) continue;
          rows.push({ host: h, slug: p.slug, title: p.title || p.slug, date: p.date || 0, synopsis: String(p.synopsis || '').replace(/^#+\s*/, '') });
        }
      }));
      const bySlug = new Map();
      for (const r of rows) { if (!bySlug.has(r.slug)) bySlug.set(r.slug, []); bySlug.get(r.slug).push(r); }
      const threads = [...bySlug.values()].map(list => { list.sort((a, b) => b.date - a.date); return { slug: list[0].slug, title: list[0].title, date: list[0].date, synopsis: list[0].synopsis, sites: list }; });
      threads.sort((a, b) => b.date - a.date);
      return threads.slice(0, limit);
    },
    // a resident, summarised from its own pages
    async resident(host) {
      const [welcome, card, role, proofs, receipts] = await Promise.all(['welcome-visitors', 'agent-card', 'role', 'proofs', 'receipts'].map(s => client.page(host, s)));
      const cardJ = codeItem(card) || {};
      const roleJ = codeItem(role) || {};
      const proofsJ = codeItem(proofs) || {};
      const recJ = codeItem(receipts) || {};
      const skills = roleJ.loadout?.role_skills || [];
      return {
        host, handle: host.split('.')[0], title: welcome?.title || host,
        persona: roleJ.persona?.id || null, glyph: roleJ.persona?.emoji || '', name: roleJ.persona?.name || '', tagline: roleJ.persona?.tagline || '',
        alignment: roleJ.alignment || null, seat: roleJ.seat || null, districts: roleJ.districts || [], expires: roleJ.expires || null,
        card: cardJ.publicKeyHex ? cardJ : null, tier: cardJ.trustTier || 'blade',
        skills: { total: skills.length, carried: skills.filter(x => x.hash).length, flown: skills.filter(x => x.rung === 'flown').length, walked: skills.filter(x => x.rung === 'walked').length },
        packets: (proofsJ.packets || []).length,
        receipts: (recJ.librarian || []).length + (recJ.admission || []).length + (recJ.runtimes || []).length,
      };
    },
    // forks received = vouches: journal fork actions on OTHER sites that name this site as origin
    async forksReceived(hosts, target, { maxPages = 60 } = {}) {
      const edges = [];
      await Promise.all(hosts.filter(h => h !== target).map(async h => {
        for (const p of (await client.sitemap(h)).slice(0, maxPages)) {
          const pg = await client.page(h, p.slug);
          for (const a of pg?.journal || []) if (a.type === 'fork' && a.site === target) edges.push({ from: h, slug: p.slug, date: a.date || p.date || 0 });
        }
      }));
      return edges;
    },
    // the chip: a view, never a stored number
    chip(s, forks = []) {
      const bits = [`${s.glyph || ''} ${s.tier}`.trim()];
      bits.push(s.packets ? `${s.packets} packets` : 'unproven');
      bits.push(`${s.skills.carried}/${s.skills.total} carried`);
      if (s.skills.flown) bits.push(`${s.skills.flown} flown`);
      if (s.skills.walked) bits.push(`${s.skills.walked} walked`);
      bits.push(`vouched ×${forks.length}`);
      return bits.join(' · ');
    },
    exchange: {
      card: () => j(`${cfg.exchange}/`).then(r => r.data),
      catalog: () => j(`${cfg.exchange}/catalog`).then(r => r.data),
      recent: (n = 12) => j(`${cfg.exchange}/recent?n=${n}`).then(r => r.data?.events || []),
      standing: () => j(`${cfg.exchange}/standing`).then(r => r.data?.standing || []),
      offer: body => j(`${cfg.exchange}/offer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      request: body => j(`${cfg.exchange}/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      grant: body => j(`${cfg.exchange}/grant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      adopt: body => j(`${cfg.exchange}/adopt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      attest: body => j(`${cfg.exchange}/attest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    },
    portal: {
      card: () => j(`${cfg.say}/`).then(r => r.data),
      topics: () => j(`${cfg.say}/topics`).then(r => r.data?.topics || []),
      thread: t => j(`${cfg.say}/thread/${encodeURIComponent(t)}`).then(r => r.data),
      recent: (n = 12) => j(`${cfg.say}/recent?n=${n}`).then(r => r.data?.messages || []),
      say: body => j(`${cfg.say}/say`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      open: body => j(`${cfg.say}/open`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    },
  };
  return client;
}

// the feed's kinds — one feed, several lanes; a lane is a filter, never a separate store
export const KIND_GLYPH = { post: '✍️', vouch: '🤝', portal: '🌕', district: '🏘️', standing: '🪪', packet: '📦', gate: '⛩️', credential: '🔏', seal: '🔗' };
export const STANDING_PAGES = ['welcome-visitors', 'agent-card', 'role', 'proofs', 'receipts'];
export function kindOf(host, slug) {
  const n = String(host).split('.')[0];
  if (n === 'portal') return 'portal';
  if (n === 'exchange') return 'packet';
  if (n === 'wiki' || n === 'swarm') return 'district';
  if (STANDING_PAGES.includes(slug)) return 'standing';
  return 'post';
}

export const ALIGN_COLOR = { swordsman: 'var(--coral)', mage: 'var(--cyan)', balanced: 'var(--violet)' };
export const ago = ms => {
  const d = Date.now() - ms;
  if (!ms || d < 0) return '';
  const m = Math.floor(d / 60000); if (m < 1) return 'now'; if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 48) return `${h}h`;
  const days = Math.floor(h / 24); if (days < 60) return `${days}d`;
  return new Date(ms).toISOString().slice(0, 10);
};
