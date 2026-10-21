// The member door (community-site template · /members/ and /members/home/).
//
// One page in three states, decided by the wallet, never by this script:
//   - no wallet on this page            → the landing as written (sign in from a wallet or the console)
//   - wallet, not a member here         → "Ask to join": the community DID, ready for the wallet's 🤝
//   - wallet, member                    → the door opens: /members/ sends you through to /members/home/
//
// How it knows: the Star Key wallet injects `window.vtaWallet` on sites the person has allowed and,
// for the page a community's DID document names as its SignInPortal (this one), answers
// `membership.status({hostDid})` with the wallet's own record — the identities it signs in with here
// and the agreement it holds with this community. A view, never a credential or a signature. The
// community DID is read live from the daemon (/health), the same way the front page reads it.
//
// Served under default-src 'self' with connect-src to the API host (.vtc-website.toml).
(() => {
  const $ = (id) => document.getElementById(id);
  const text = (id, v) => { const n = $(id); if (n && v != null) n.textContent = v; };
  const show = (id, on) => { const n = $(id); if (n) n.hidden = !on; };
  const code = (s) => { const c = document.createElement('code'); c.textContent = s; return c; };
  const WAIT_MS = 1500; // the provider is injected after the page's own scripts; give it a moment

  async function api() {
    const cfg = await fetch('/community.config.json').then((r) => r.json()).catch(() => ({}));
    return (cfg && typeof cfg.api === 'string' ? cfg.api.replace(/\/$/, '') : '');
  }
  async function communityDid(base) {
    const h = await fetch(base + '/health').then((r) => r.json());
    if (!h || typeof h.vtc_did !== 'string') throw new Error('no community DID at ' + base + '/health');
    return h.vtc_did;
  }
  function wallet() {
    return new Promise((resolve) => {
      if (window.vtaWallet) return resolve(window.vtaWallet);
      const t = setTimeout(() => resolve(window.vtaWallet || null), WAIT_MS);
      window.addEventListener('vtawallet:ready', () => { clearTimeout(t); resolve(window.vtaWallet || null); }, { once: true });
    });
  }

  async function main() {
    const page = document.body.dataset.page; // "door" or "home"
    const base = await api();
    let did = '';
    try { did = await communityDid(base); } catch (e) { text('did', 'the daemon did not answer'); return; }
    text('did', did);
    const w = await wallet();
    if (!w || !w.membership) {
      // No wallet: the landing stands. On the home page, a visitor without a wallet goes back to the door.
      if (page === 'home') location.replace('/members/');
      show('state-nowallet', true);
      return;
    }
    let status;
    try {
      status = await w.membership.status({ hostDid: did });
    } catch (e) {
      // The wallet refused: this page is not what the DID document names, or the wallet is locked.
      show('state-nowallet', true);
      text('wallet-note', 'Your wallet did not answer for this page: ' + (e && e.message ? e.message : e));
      return;
    }
    if (!status.member) {
      if (page === 'home') { location.replace('/members/'); return; }
      show('state-join', true);
      const btn = $('copy-did');
      if (btn) btn.onclick = () => navigator.clipboard.writeText(did).then(() => { btn.textContent = 'copied'; });
      return;
    }
    // A member.
    if (page === 'door') { location.replace('/members/home/'); return; }
    show('state-member', true);
    const ids = $('identities'); if (ids) { ids.textContent = ''; for (const d of status.identities) { const li = document.createElement('li'); li.append(code(d)); ids.append(li); } }
    if (status.agreement) {
      const a = status.agreement;
      text('agreement', a.code + ' · ' + (a.status === 'agreed' ? 'agreed' : a.status === 'declined' ? 'declined' : 'proffered, not yet decided') + ' · ' + new Date(a.at).toISOString().slice(0, 10));
    } else {
      text('agreement', 'none recorded by your wallet');
    }
    // Rooms the member shared with this portal, if the wallet has that surface.
    if (w.rooms && w.rooms.list) {
      try {
        const r = await w.rooms.list({ hostDid: did });
        const ul = $('rooms'); if (ul) { ul.textContent = ''; for (const room of r.rooms || []) { const li = document.createElement('li'); li.textContent = room.label || room.roomId; ul.append(li); } if (!(r.rooms || []).length) ul.append(Object.assign(document.createElement('li'), { textContent: 'none shared with this page yet' })); }
      } catch (e) { text('rooms-note', 'Rooms: ' + (e && e.message ? e.message : e)); }
    }
  }
  main().catch((e) => { text('wallet-note', String(e && e.message ? e.message : e)); });
})();
