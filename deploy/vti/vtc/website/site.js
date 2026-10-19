// community-site template · renders community.config.json + this daemon's live state. No keys, no third parties.
// Live reads: /v1/community/public-profile · /health · the join manifest (POST /v1/trust-tasks,
// vtc/join-requests/manifest/0.3, public, unauthenticated) · /v1/community/did-qr.svg (in the HTML).
(() => {
  const $ = id => document.getElementById(id);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) k === 'class' ? n.className = v : n.setAttribute(k, v);
    for (const k of kids) if (k != null) n.append(k.nodeType ? k : document.createTextNode(String(k)));
    return n;
  };
  const text = (id, v) => { if (v != null && $(id)) $(id).textContent = v; };
  const getJSON = async (url, opt) => { const r = await fetch(url, opt); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); };
  const TT = 'https://trusttasks.org/spec/vtc/join-requests/manifest/0.3';
  // API base: '' when the site is served by the daemon on the API's own origin; the API host (e.g.
  // https://vtc.mages.city) when it has a dedicated website host, as a filesystem website must (CORS + CSP set for it).
  let API = '';

  async function manifest(did) {
    const doc = { id: 'urn:uuid:' + crypto.randomUUID(), type: TT, issuedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), recipient: did, payload: {} };
    const r = await getJSON(API + '/v1/trust-tasks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(doc) });
    if (!r.payload || !Array.isArray(r.payload.criteria)) throw new Error(r.payload && r.payload.message || 'no criteria');
    return r.payload.criteria;
  }

  function requires(c) {
    const parts = [];
    if (c.invitationRequired) parts.push('an invitation this community issued');
    if (c.presentationDefinition) {
      const types = (c.presentationDefinition.credentials || []).flatMap(x => (x.meta && x.meta.type_values || []).flat());
      parts.push((types.join(', ') || 'a credential') + (c.credentialIssuers ? ' (issuers: ' + c.credentialIssuers + ')' : ''));
    }
    if (c.vetting) parts.push('peer vetting');
    return parts.length ? parts.join(' + ') : 'nothing';
  }

  function palette(p) { if (p) for (const [k, v] of Object.entries(p)) document.documentElement.style.setProperty('--' + k, v); }

  function renderConfig(cfg) {
    palette(cfg.palette);
    document.title = (cfg.name || 'Community') + ' · Verifiable Trust Community';
    text('brand', cfg.brand || cfg.name); text('name', cfg.name); text('kicker', cfg.kicker); text('tagline', cfg.tagline);
    text('did-hint', cfg.didHint); text('doors-intro', cfg.doorsIntro); text('receive', cfg.receive); text('footer', cfg.footer);
    const nav = $('nav'); nav.textContent = '';
    for (const l of cfg.nav || []) nav.append(el('a', { href: l.href }, l.label));
    const learn = $('learn'); learn.textContent = '';
    for (const l of cfg.learn || []) learn.append(el('a', { href: l.href }, l.label));
    const doors = $('doors'); doors.textContent = '';
    for (const d of cfg.doors || []) {
      const ol = el('ol');
      for (const s of d.steps || []) {
        const li = el('li', {}, s.text);
        if (s.code) li.append(el('pre', {}, s.code));
        ol.append(li);
      }
      doors.append(el('article', { class: 'door', id: 'door-' + d.id },
        el('p', { class: 'tag' }, d.kicker || ''), el('h3', {}, d.title), el('p', { class: 'who' }, d.who), ol,
        d.criterion ? el('p', { class: 'crit', 'data-criterion': d.criterion }, 'criterion ', el('b', {}, d.criterion)) : null));
    }
    const f = cfg.found;
    if (f) {
      $('found').hidden = false;
      text('found-kicker', f.kicker); text('found-h', f.title); text('found-body', f.body);
      const ol = $('found-steps'); for (const s of f.steps || []) ol.append(el('li', {}, s));
      const a = $('found-cta'); a.textContent = f.cta && f.cta.label || ''; a.href = f.cta && f.cta.href || '#';
    }
  }

  function renderCriteria(criteria) {
    const tb = $('criteria'); tb.textContent = '';
    criteria.forEach((c, i) => tb.append(el('tr', {},
      el('td', {}, i + 1), el('td', {}, el('code', {}, c.id), c.description ? el('div', { class: 'small muted' }, c.description) : null),
      el('td', { class: 'adm-' + c.admission }, c.admission), el('td', {}, requires(c)))));
    const ids = new Set(criteria.map(c => c.id));
    for (const p of document.querySelectorAll('.crit[data-criterion]')) {
      const live = ids.has(p.dataset.criterion);
      p.classList.toggle('missing', !live);
      if (!live) p.append(' · not yet published');
    }
  }

  function status(cls, msg) { $('status').className = 'status ' + cls; text('status-text', msg); }

  async function main() {
    let cfg = {};
    try { cfg = await getJSON('/community.config.json'); API = (cfg.api || '').replace(/\/$/, ''); renderConfig(cfg); } catch (e) { console.warn('config', e); }
    const qr = $('qr'); qr.addEventListener('error', () => qr.classList.add('gone'));
    qr.src = API + '/v1/community/did-qr.svg';
    for (const a of document.querySelectorAll('a[data-api-path]')) a.href = API + a.dataset.apiPath;
    if (!cfg.memberPortal) for (const a of document.querySelectorAll('a[data-api-path="/members/"]')) a.remove();
    let did = null;
    try {
      const p = await getJSON(API + '/v1/community/public-profile');
      did = p.communityDid || null;
      if (p.name) { text('name', p.name); if (!cfg.brand) text('brand', p.name); }
      if (p.description) text('desc', p.description);
    } catch (e) { console.warn('profile', e); }
    if (did) { text('did', did); $('copy').hidden = false; }
    else text('did', 'not published yet');
    $('copy').addEventListener('click', () => navigator.clipboard && navigator.clipboard.writeText($('did').textContent).then(() => text('copy', 'copied')));
    let healthy = false, version = '';
    try { const h = await getJSON(API + '/health'); healthy = h.status === 'ok'; version = h.version || ''; } catch (e) { /* down */ }
    let crit = null;
    if (did) { try { crit = await manifest(did); renderCriteria(crit); } catch (e) { console.warn('manifest', e); } }
    if (!crit) $('criteria').firstElementChild.firstElementChild.textContent = 'the join manifest did not answer; the community may not be accepting applications right now';
    if (healthy && crit) status('ok', 'the node is up · vtc ' + version + ' · accepting applications under ' + crit.length + ' criteria');
    else if (healthy) status('degraded', 'the node is up · vtc ' + version + ' · join manifest unavailable');
    else status('down', 'the node is not answering right now');
  }
  main();
})();
