// site/config.js — where the front finds its body. Local twin vs production is decided
// by the hostname, so nothing here is edited at deploy time.
//   local:  mages.localhost:3334 (front) · wiki.mages.localhost:3333 · portal.mages.localhost:4445 (desk)
//   prod:   mages.city (front, Workers assets) · wiki.mages.city · portal.mages.city (desk path-routed by the tunnel)
(() => {
  const h = location.hostname;
  const local = h.endsWith('.localhost') || h === 'localhost' || h === '127.0.0.1';
  const tld = local ? 'mages.localhost' : h.replace(/^www\./, '');
  const scheme = local ? 'http' : 'https';
  const p = port => (local ? ':' + port : '');
  const site = host => `${scheme}://${host}${p(3333)}`;
  window.MAGES = {
    local, tld, scheme, site,
    front: local ? `http://${tld}:3334` : `https://${tld}`,
    wiki: site('wiki.' + tld),
    portalPages: site('portal.' + tld),
    say: `${scheme}://portal.${tld}${p(4445)}`,
    swarm: site('swarm.' + tld),
    exchangePages: site('exchange.' + tld),
    exchange: `${scheme}://exchange.${tld}${p(4448)}`,   // the Exchange desk (JSON)
    vta: local ? null : `https://vta.${tld}`,     // the VTA service (OpenVTC) — not part of the local twin
  };
})();
