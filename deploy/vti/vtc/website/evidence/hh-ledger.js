// evidence/hh-ledger.js · a Hitchhiker’s Guide to Trust evidence ledger (trust.mages.city /api/evidence).
// Accepts the JSON from the guide’s evidence page, or the copied note text. The root re-derives from the
// links' hashes; whether those links sit on the chain needs the issuer, so the keeper checks that.
(() => {
  'use strict';
  const E = globalThis.EvidenceCommon;
  const CHECK = 'https://trust.mages.city/api/evidence?mark=';

  async function check(raw) {
    const j = E.parseJSON(raw);
    if (j && Array.isArray(j.links) && /^[0-9a-f]{64}$/.test(j.root || '')) {
      const root = await E.foldRoot(j.links.map(l => l.hash));
      if (root !== j.root) return { ok: false, error: 'The root does not re-derive from these links: expected ' + root.slice(0, 12) + '…' };
      const nights = Array.isArray(j.nights) ? j.nights.join(', ') : '';
      return { ok: true, root: 'sha256:' + root, sigil: E.glyphs(root), seal: E.seal(root),
        checked: ['the root re-derives from the ledger’s links'],
        fields: [['guide', j.guide || 'The Hitchhiker’s Guide to Trust'], ['stars', String(j.stars != null ? j.stars : j.links.length)]].concat(nights ? [['nights', nights]] : []).concat(j.mark ? [['mark', j.mark]] : []),
        warnings: ['that these links sit on the guide’s chain is checked by the keeper at trust.mages.city'],
        send: { root: 'sha256:' + root, mark: j.mark || null, stars: j.stars != null ? j.stars : j.links.length } };
    }
    // the copied note: "<guide> (nights) · evidence: N stars · root <hex> · check …?mark=<mark>"
    const m = /root\s+([0-9a-f]{64})/i.exec(raw || ''), mk = /mark=([0-9a-f]{64})/i.exec(raw || ''), n = /(\d+)\s+stars?/i.exec(raw || '');
    if (m) {
      const root = m[1].toLowerCase();
      return { ok: true, root: 'sha256:' + root, sigil: E.glyphs(root), seal: E.seal(root), checked: [],
        fields: [['stars', n ? n[1] : '?']].concat(mk ? [['mark', mk[1]], ['keeper checks at', CHECK + mk[1]]] : []),
        warnings: ['a copied note carries the root but not the links, so nothing re-derives here; for a checked root, drop the ledger JSON from the guide’s evidence page'],
        send: { root: 'sha256:' + root, mark: mk ? mk[1] : null, stars: n ? +n[1] : null } };
    }
    return { ok: false, error: 'No ledger found. Drop the JSON from the guide’s evidence page, or paste the note you copied there.' };
  }
  globalThis.CityEvidence.verifiers.hhLedger = check;
})();
