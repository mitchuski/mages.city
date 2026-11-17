// evidence.js · the Mages City evidence window. Reads evidence-types.json (the registry), lets an applicant drop or
// paste what they carry, runs that type's verifier IN THIS BROWSER, and builds a short application to send with the
// join request. Nothing is uploaded: no fetch leaves this origin, and the only fetch is the registry itself.
//
// Adding a type: add an entry to evidence-types.json with "verifier": "<name>", and register
//   CityEvidence.verifiers["<name>"] = async (input) => ({ ok, root, sigil, proverb, fields: [[label, value]...], warnings: [] })
// in a file listed in the entry's "module" (loaded on demand from this origin).
(() => {
  const $ = id => document.getElementById(id);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) k === 'class' ? n.className = v : n.setAttribute(k, v);
    for (const k of kids) if (k != null) n.append(k.nodeType ? k : document.createTextNode(String(k)));
    return n;
  };
  const loaded = new Set();
  const loadModule = src => new Promise((ok, bad) => {
    if (!src || loaded.has(src)) return ok();
    if (!/^\/evidence\/[a-z0-9_.-]+\.js(\?v=\w+)?$/i.test(src)) return bad(new Error('module outside /evidence/'));
    const s = document.createElement('script'); s.src = src; s.defer = true;
    s.onload = () => { loaded.add(src); ok(); }; s.onerror = () => bad(new Error('could not load ' + src));
    document.head.append(s);
  });

  const CityEvidence = {
    verifiers: {},
    types: [],
    current: null,
    async mount() {
      try {
        const r = await fetch('/evidence-types.json'); if (!r.ok) throw new Error(r.status);
        this.types = ((await r.json()).types || []).filter(t => t.status !== 'hidden');
      } catch (e) { console.warn('evidence registry', e); $('evidence').hidden = true; return; }
      const bar = $('ev-types'); bar.textContent = '';
      this.types.forEach((t, i) => {
        const b = el('button', { type: 'button', role: 'tab', 'aria-selected': i ? 'false' : 'true', 'data-id': t.id }, t.label + (t.status === 'soon' ? ' · soon' : ''));
        b.addEventListener('click', () => this.select(t.id));
        bar.append(b);
      });
      if (this.types.length) this.select(this.types[0].id);
      const drop = $('ev-drop'), file = $('ev-file');
      file.addEventListener('change', () => file.files[0] && this.readFile(file.files[0]));
      drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
      drop.addEventListener('dragleave', () => drop.classList.remove('over'));
      drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) this.readFile(f); });
      $('ev-check').addEventListener('click', () => this.check($('ev-text').value));
    },
    select(id) {
      this.current = this.types.find(t => t.id === id);
      for (const b of $('ev-types').children) b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false');
      const w = $('ev-where'); w.textContent = '';
      const t = this.current;
      w.append(t.where || '');
      if (t.whereLink) w.append(' ', el('a', { href: t.whereLink.href, rel: 'noopener' }, t.whereLink.label));
      $('ev-drop-text').textContent = t.dropText || 'Drop your file here, or choose it';
      $('ev-result').hidden = true;
    },
    async readFile(f) {
      if (f.size > 2 * 1024 * 1024) return this.show({ ok: false, error: 'That file is over 2 MB; evidence files are small. Check you chose the right one.' });
      this.check(await f.text());
    },
    async check(raw) {
      const t = this.current;
      if (!t) return;
      if (t.status === 'soon') return this.show({ ok: false, error: t.label + ' opens soon. Choose another type for now.' });
      try {
        for (const d of t.deps || []) await loadModule(d);
        await loadModule(t.module);
        const v = this.verifiers[t.verifier];
        if (!v) throw new Error('no verifier for ' + t.label);
        this.show(await v(String(raw || '').trim(), t), t);
      } catch (e) { this.show({ ok: false, error: e.message || String(e) }, t); }
    },
    show(res, t) {
      const box = $('ev-result'); box.hidden = false; box.textContent = '';
      if (!res.ok) { box.append(el('p', { class: 'verdict bad' }, '✕ ' + (res.error || 'could not check this'))); return; }
      const warn = (res.warnings || []).length;
      box.append(el('p', { class: 'verdict ' + (warn ? 'warn' : 'ok') }, (warn ? '◐ checked, with notes' : '✓ checked in your browser') + ' · ' + t.label));
      const dl = el('dl');
      if (res.root) dl.append(el('dt', {}, 'evidence root'), el('dd', {}, el('code', {}, res.root)));
      if (res.seal) dl.append(el('dt', {}, 'seal · Sigil 0.1.1'), el('dd', {}, el('code', {}, res.seal)));
      if (res.sigil) dl.append(el('dt', {}, 'glyphs'), el('dd', { class: 'sigil' }, res.sigil));
      if (res.proverb) dl.append(el('dt', {}, 'proverb'), el('dd', { class: 'proverb' }, res.proverb));
      for (const [k, v] of res.fields || []) dl.append(el('dt', {}, k), el('dd', {}, v));
      box.append(dl);
      if ((res.checked || []).length) box.append(el('ul', { class: 'checked' }, ...res.checked.map(c => el('li', {}, '✓ ' + c))));
      for (const w of res.warnings || []) box.append(el('p', { class: 'small' }, '◐ ' + w));
      const app = this.application(res, t);
      const pre = el('pre', {}, app);
      const copy = el('button', { type: 'button' }, 'Copy your application');
      copy.addEventListener('click', () => navigator.clipboard && navigator.clipboard.writeText(app).then(() => { copy.textContent = 'Copied'; }));
      box.append(el('h3', {}, 'Your application'), el('p', { class: 'small' }, 'Send this with your join request (door 2, Mage). It carries the root and what you chose to show, nothing else.'), pre, copy);
    },
    application(res, t) {
      const lines = ['Mages City · application · door 2 · mage', 'evidence: ' + t.id + ' (' + t.label + ')'];
      if (res.root) lines.push('root: ' + res.root);
      if (res.seal) lines.push('seal: ' + res.seal);
      if (res.sigil) lines.push('glyphs: ' + res.sigil);
      for (const c of res.checked || []) lines.push('checked: ' + c);
      if (res.proverb) lines.push('proverb: ' + res.proverb);
      for (const [k, v] of res.fields || []) lines.push(k + ': ' + v);
      lines.push('checked in the applicant’s browser at join.mages.city, ' + new Date().toISOString().slice(0, 10));
      // the same, as the join request's extensions.evidence entry: roots and disclosed fields only, a few hundred bytes
      const ext = { type: t.id, root: res.root || null, seal: res.seal || null, checked: res.checked || [], disclosed: res.send || {} };
      lines.push('', 'extensions.evidence:', JSON.stringify([ext]));
      return lines.join('\n');
    },
  };
  window.CityEvidence = CityEvidence;
})();
