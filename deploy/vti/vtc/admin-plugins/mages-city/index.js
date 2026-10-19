// Mages City · the keeper's desk — an OpenVTC console plugin (admin_ui.plugin_dir/mages-city).
// Reads only: public endpoints (health, profile, join manifest), node.json (written on the node at sync time by
// sync-console.sh) and intended-criteria.json. The console's own pages do every signed act; this page links to them.
// Third-party plugins get no signing helper from window.VtcPluginApi, so signed reads (join-request list) stay there.
const BASE = '/admin/plugins/mages-city/';
const SITE = 'https://join.mages.city/';
const TT_MANIFEST = 'https://trusttasks.org/spec/vtc/join-requests/manifest/0.3';

const h = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) k === 'class' ? (n.className = v) : n.setAttribute(k, v);
  for (const k of kids.flat()) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(String(k)));
  return n;
};
const json = async (url, opt) => { const r = await fetch(url, { cache: 'no-store', ...opt }); if (!r.ok) throw new Error(url + ' → ' + r.status); return r.json(); };

async function manifest(did) {
  const doc = { id: 'urn:uuid:' + crypto.randomUUID(), type: TT_MANIFEST, issuedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), recipient: did, payload: {} };
  const r = await json('/v1/trust-tasks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(doc) });
  if (!r.payload || !Array.isArray(r.payload.criteria)) throw new Error((r.payload && r.payload.message) || 'manifest unavailable');
  return r.payload.criteria;
}

const pill = (state, label) => h('span', { class: 'pill ' + state }, label);
const consoleLink = (path, label) => h('a', { class: 'act', href: '/admin' + path }, label);

class MagesCityDesk extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: 'open' });
    root.append(h('link', { rel: 'stylesheet', href: BASE + 'style.css' }));
    this.main = h('section', { class: 'desk' }, h('p', { class: 'muted' }, 'reading the City…'));
    root.append(this.main);
    this.render().catch(e => { this.main.replaceChildren(h('p', { class: 'bad' }, 'could not read the City: ' + e.message)); });
  }

  async render() {
    const [health, profile, node, intended] = await Promise.all([
      json('/health').catch(() => null),
      json('/v1/community/public-profile').catch(() => null),
      json(BASE + 'node.json').catch(() => null),
      json(BASE + 'intended-criteria.json').catch(() => ({ criteria: [], remove: [] })),
    ]);
    let live = null, liveErr = '';
    if (profile && profile.communityDid) { try { live = await manifest(profile.communityDid); } catch (e) { liveErr = e.message; } }

    const head = h('header', {},
      h('p', { class: 'tag' }, 'the keeper’s desk · OpenVTC customised for Mages City'),
      h('h2', {}, (profile && profile.name) || 'Mages City'),
      h('p', { class: 'muted' }, 'Everything the City adds to the stock console starts here. Each act below opens the console page that signs it.'));

    // 1 · the doors: what a keeper does
    const doors = h('div', { class: 'card' }, h('h3', {}, 'Doors'),
      h('p', { class: 'muted' }, 'The three ways in, and the act each one asks of you.'),
      h('ul', { class: 'acts' },
        h('li', {}, h('b', {}, 'Invited'), ' · issue an invitation; the invitee is admitted automatically. ', consoleLink('/invitations', 'Invitations →')),
        h('li', {}, h('b', {}, 'Autoresearch mage'), ' · review the evidence root and its chronicle, then decide. ', consoleLink('/join-requests', 'Join requests →')),
        h('li', {}, h('b', {}, 'Keeper'), ' · review and decide. ', consoleLink('/join-requests', 'Join requests →')),
        h('li', {}, h('b', {}, 'Members'), ' · who holds what, renewals, removals. ', consoleLink('/members', 'Members →'))));

    // 2 · criteria: intended vs live
    const rows = [];
    const liveIds = live ? live.map(c => c.id) : [];
    (intended.criteria || []).forEach((c, i) => {
      const at = liveIds.indexOf(c.id);
      const lc = at >= 0 ? live[at] : null;
      const state = !live ? pill('unk', 'unknown') : !lc ? pill('bad', 'not published') : lc.admission !== c.admission ? pill('warn', 'admission ' + lc.admission) : pill('ok', 'published #' + (at + 1));
      rows.push(h('tr', {}, h('td', {}, i + 1), h('td', {}, h('code', {}, c.id)), h('td', {}, c.admission), h('td', {}, state)));
    });
    for (const id of intended.remove || []) if (liveIds.includes(id)) rows.push(h('tr', {}, h('td', {}, '–'), h('td', {}, h('code', {}, id)), h('td', {}, 'remove'), h('td', {}, pill('warn', 'still published'))));
    const order = live && (intended.criteria || []).every(c => liveIds.includes(c.id)) && (intended.criteria || []).map(c => liveIds.indexOf(c.id)).every((v, i, a) => !i || v > a[i - 1]);
    const crit = h('div', { class: 'card' }, h('h3', {}, 'Join criteria · intended vs live'),
      liveErr ? h('p', { class: 'bad' }, 'join manifest: ' + liveErr) : null,
      h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, '#'), h('th', {}, 'criterion'), h('th', {}, 'admission'), h('th', {}, 'live'))), h('tbody', {}, rows)),
      h('p', { class: 'muted small' }, order ? 'In force, in order.' : 'To match: register the missing criteria, remove the extra, keep the requirement-free review last. ', order ? null : consoleLink('/vetting/requirements', 'Vetting → Requirements →')));

    // 3 · the node
    const svc = node && node.services ? Object.entries(node.services).map(([k, v]) => h('li', {}, pill(v === 'active' ? 'ok' : 'bad', v), ' ', k)) : [h('li', { class: 'muted' }, 'node.json not found: run sync-console.sh on the node')];
    const bins = node && node.binaries ? node.binaries.map(b => h('li', {}, b.held ? pill('warn', 'held') : pill('ok', 'current'), ' ', b.name, ' ', h('code', { class: 'muted' }, b.sha12))) : [];
    const nodeCard = h('div', { class: 'card' }, h('h3', {}, 'The core node'),
      h('p', {}, (health && health.status === 'ok') ? pill('ok', 'up') : pill('bad', 'not healthy'), ' vtc ', (health && health.version) || '?', node && node.checkedAt ? h('span', { class: 'muted' }, ' · node read ' + node.checkedAt) : null),
      h('ul', { class: 'cols' }, svc), bins.length ? h('details', {}, h('summary', {}, 'binaries'), h('ul', {}, bins)) : null,
      node && node.notes ? h('ul', { class: 'muted small' }, node.notes.map(n => h('li', {}, n))) : null);

    // 4 · the public face + the template
    const face = h('div', { class: 'card' }, h('h3', {}, 'The public face'),
      h('p', {}, h('a', { href: SITE, target: '_blank', rel: 'noopener' }, 'join.mages.city ↗'), ' · the community-site template, served by this daemon on its own host. Edit ', h('code', {}, 'community.config.json'), ', run ', h('code', {}, 'sync-website.sh'), ', reload: no restart.'),
      h('p', {}, consoleLink('/profile', 'Community profile →'), ' (name, description, logo: the page reads them live)'),
      h('p', { class: 'muted small' }, 'Create your own mage: this desk, the doors, the site and the node kit are the template a founding mage takes away. See docs/OPENVTC_CUSTOMISATION.md.'));

    this.main.replaceChildren(head, h('div', { class: 'grid' }, doors, crit, nodeCard, face));
  }
}

customElements.define('mages-city-desk', MagesCityDesk);
window.VtcPluginApi.registerPlugin({ id: 'mages-city', label: 'Mages City', path: '/mages-city', elementTag: 'mages-city-desk', icon: '🧙', group: 'overview' });
