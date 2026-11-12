// sign-in.js — the sign-in door. Reads the community DID from the daemon's /health and offers to copy it.
// Served under default-src 'self' with connect-src to the API host (.vtc-website.toml).
(() => {
  const $ = (id) => document.getElementById(id);
  async function main() {
    const cfg = await fetch('/community.config.json').then((r) => r.json()).catch(() => ({}));
    const base = (cfg && typeof cfg.api === 'string' ? cfg.api.replace(/\/$/, '') : '');
    const h = await fetch(base + '/health').then((r) => r.json()).catch(() => null);
    if (!h || typeof h.vtc_did !== 'string') { $('did').textContent = 'the daemon did not answer'; return; }
    $('did').textContent = h.vtc_did;
    const btn = $('copy-did'); btn.hidden = false;
    btn.addEventListener('click', () => navigator.clipboard && navigator.clipboard.writeText(h.vtc_did).then(() => { btn.textContent = 'copied'; }));
  }
  main();
})();
