// community-site template, Mages City edition · renders community.config.json + this daemon's live state. No keys, no third parties.
// Live reads: /v1/community/public-profile · /health · the join manifest (POST /v1/trust-tasks,
// vtc/join-requests/manifest/0.4, public, unauthenticated) · /v1/community/did-qr.svg.
// Evidence checking is in evidence.js (window.CityEvidence); it runs in this browser and sends nothing.
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
  const TT = 'https://trusttasks.org/spec/vtc/join-requests/manifest/0.4';
  // API base: '' when served by the daemon on the API's own origin; the API host (https://vtc.mages.city)
  // when the site has a dedicated website host, as a filesystem website must (CORS + CSP set for it).
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

  // headline allows one <em> and nothing else
  function headline(s) {
    const h = $('headline'); if (!s) return; h.textContent = '';
    const m = /^(.*?)<em>(.*?)<\/em>(.*)$/.exec(s);
    if (!m) { h.textContent = s; return; }
    h.append(m[1], el('em', {}, m[2]), m[3]);
  }

  function renderConfig(cfg) {
    document.title = 'Join · ' + (cfg.name || 'Community');
    text('brand', cfg.brand || cfg.name); text('kicker', cfg.kicker); headline(cfg.headline); text('motto', cfg.motto); text('tagline', cfg.tagline);
    text('did-hint', cfg.didHint); text('receive', cfg.receive); text('footer', cfg.footer);
    text('evidence-intro', cfg.evidenceIntro); text('evidence-privacy', cfg.evidencePrivacy);
    const nav = $('nav'); nav.textContent = '';
    for (const l of cfg.nav || []) nav.append(el('a', { href: l.href, class: l.class }, l.label));
    const learn = $('learn'); learn.textContent = '';
    (cfg.learn || []).forEach((l, i) => { if (i) learn.append(' · '); learn.append(el('a', { href: l.href }, l.label)); });
    if (cfg.foundLine) { const f = cfg.foundLine; const p = $('found-line'); p.textContent = ''; p.append(f.text + ' ', el('a', { href: f.href }, f.label)); }

    const steps = $('steps'); steps.textContent = '';
    (cfg.steps || []).forEach((s, i) => {
      const body = el('div', {}, el('h3', {}, s.title), el('p', {}, s.text));
      if (s.code) body.append(el('pre', {}, s.code));
      if (s.link) body.append(el('p', { class: 'small' }, el('a', { href: s.link.href }, s.link.label)));
      steps.append(el('div', { class: 'step' }, el('span', { class: 'num' }, String(i + 1).padStart(2, '0')), body));
    });

    const doors = $('doors'); doors.textContent = '';
    for (const d of cfg.doors || []) {
      doors.append(el('article', { class: 'way' + (d.primary ? ' primary' : ''), id: 'door-' + d.id },
        el('p', { class: 'tag' }, (d.glyph ? d.glyph + '  ' : '') + (d.kicker || '')),
        el('h3', {}, d.title), el('p', {}, d.who),
        d.note ? el('p', { class: 'soon' }, d.note) : null,
        d.link ? el('p', {}, el('a', { class: 'go', href: d.link.href }, d.link.label)) : null,
        d.related ? el('p', { class: 'small' }, el('a', { href: d.related.href }, d.related.label)) : null,
        el('p', { class: 'adm', 'data-criterion': d.criterion || '' }, d.admission || '')));
    }
    if (location.hash && location.hash.startsWith('#door-')) {
      const t = document.getElementById(location.hash.slice(1));
      if (t) t.scrollIntoView({ block: 'start' });
    }
  }

  function renderCriteria(criteria) {
    const ol = $('criteria'); ol.textContent = '';
    for (const c of criteria) ol.append(el('li', {},
      el('code', {}, c.id), ' · ', el('span', { class: 'adm-' + c.admission }, c.admission), ' · requires ', requires(c),
      c.description ? el('div', { class: 'small' }, c.description) : null));
    text('criteria-sum', criteria.length + ' criteria, live from the join manifest');
    const ids = new Set(criteria.map(c => c.id));
    for (const p of document.querySelectorAll('.adm[data-criterion]')) {
      if (p.dataset.criterion && !ids.has(p.dataset.criterion)) { p.classList.add('missing'); p.append(' · opening soon'); }
    }
  }

  function status(cls, msg) { $('status').className = 'notice ' + cls; text('status-text', msg); }

  async function main() {
    let cfg = {};
    try { cfg = await getJSON('/community.config.json'); API = (cfg.api || '').replace(/\/$/, ''); renderConfig(cfg); } catch (e) { console.warn('config', e); }
    if (window.CityEvidence) window.CityEvidence.mount();
    const qr = $('qr'); qr.addEventListener('error', () => qr.classList.add('gone'));
    qr.src = API + '/v1/community/did-qr.svg';
    for (const a of document.querySelectorAll('a[data-api-path]')) a.href = API + a.dataset.apiPath;
    let did = null;
    try {
      const p = await getJSON(API + '/v1/community/public-profile');
      did = p.communityDid || null;
    } catch (e) { console.warn('profile', e); }
    if (did) { text('did', did); $('copy').hidden = false; }
    else text('did', 'not published yet');
    $('copy').addEventListener('click', () => navigator.clipboard && navigator.clipboard.writeText($('did').textContent).then(() => text('copy', 'Copied')));
    let healthy = false, version = '';
    try { const h = await getJSON(API + '/health'); healthy = h.status === 'ok'; version = h.version || ''; } catch (e) { /* down */ }
    let crit = null;
    if (did) { try { crit = await manifest(did); renderCriteria(crit); } catch (e) { console.warn('manifest', e); } }
    if (!crit) $('criteria').firstElementChild.textContent = 'the join manifest did not answer; the community may not be accepting applications right now';
    if (healthy && crit) status('ok', 'the City is open · vtc ' + version + ' · ' + crit.length + ' ways to be admitted');
    else if (healthy) status('degraded', 'the City is up · vtc ' + version + ' · join manifest unavailable');
    else status('down', 'the City’s node is not answering right now; the door opens again when it is back');
  }
  main();
})();
