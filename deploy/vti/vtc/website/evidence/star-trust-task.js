// evidence/star-trust-task.js · a Star trust-task proof (agentprivacy/island-stone/1) from the privacy Star.
// Port of agentprivacy_master src/lib/stone-proof.ts verifyStoneProof, steps 1–4 (all offline). Step 5, the
// shared chain's witness, needs the issuer and is left to the keeper.
(() => {
  'use strict';
  const E = globalThis.EvidenceCommon;
  const KIND = 'agentprivacy/island-stone/1';

  async function check(raw) {
    const p = E.parseJSON(raw);
    if (!p || p.kind !== KIND || !/^[0-9a-f]{64}$/.test(p.mark || '') || !Array.isArray(p.stars) || !p.stars.length)
      return { ok: false, error: 'This is not a Star trust-task proof (agentprivacy/island-stone/1). Export it from the Star on agentprivacy.ai.' };
    let leaves = true, links = true;
    const quests = [];
    for (const s of p.stars) {
      let pre = {}; try { pre = JSON.parse(s.pre || ''); } catch (e) { /* */ }
      if (await E.sha256hex(s.pre || '') !== s.leaf || pre.type !== s.type || pre.at !== s.at) leaves = false;
      if (await E.sha256hex([s.prev, s.leaf, p.mark, s.seq].join('|')) !== s.hash) links = false;
      if (pre.content && typeof pre.content.station === 'number') quests.push(pre.content.station);
    }
    if (!leaves) return { ok: false, error: 'A star’s leaf does not re-derive from what it reveals.' };
    if (!links) return { ok: false, error: 'A star does not re-derive from its leaf, mark and place on the chain.' };
    if (!p.stars.every((s, i) => i === 0 || s.seq > p.stars[i - 1].seq)) return { ok: false, error: 'The stars are out of order.' };
    const last = p.stars[p.stars.length - 1];
    const stone = last.type === 'island/stone' && p.stars.slice(0, -1).every(s => s.type === 'island/quest');
    const root = await E.foldRoot(p.stars.map(s => s.hash));
    if (root !== p.root) return { ok: false, error: 'The root does not re-derive: expected ' + root.slice(0, 12) + '…' };
    const warnings = ['the shared chain’s witness (that the Star saw these stars when they were made) is checked by the keeper, not here'];
    if (!stone) warnings.push('the walk does not end in a stone laid at the threshold');
    return { ok: true, root: 'sha256:' + root, sigil: E.glyphs(root), seal: E.seal(root),
      checked: ['every leaf re-derives', 'every star re-derives on its chain', 'the stars are in order', 'the root re-derives'].concat(stone ? ['it ends in a stone at the threshold'] : []),
      fields: [['stars', String(p.stars.length)], ['quests walked', String(quests.length)], ['mark', p.mark]],
      warnings, send: { root: 'sha256:' + root, mark: p.mark, stars: p.stars.length } };
  }
  globalThis.CityEvidence.verifiers.starTrustTask = check;
})();
