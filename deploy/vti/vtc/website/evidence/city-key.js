// evidence/city-key.js · a City Key (agentprivacy.ai), optionally with its signed VTA record.
// Accepts: the key JSON · a VTA record (agentprivacy.vta/1) · or { "key": …, "record": … }.
// Refuses journey bundles and keyring files: they carry private material and must never be sent.
(() => {
  'use strict';
  const E = globalThis.EvidenceCommon;
  const VTA = 'agentprivacy.vta/1';

  async function check(raw) {
    const j = E.parseJSON(raw);
    if (!j || typeof j !== 'object') return { ok: false, error: 'This does not read as JSON. Drop the City Key file (.json) you exported from agentprivacy.ai.' };
    if (j.kind === 'agentprivacy.journey-bundle/1') return { ok: false, error: 'This is a journey bundle: it holds private packets. Bring your City Key instead; keep the bundle to yourself.' };
    if (j.ct && j.iv && j.sha) return { ok: false, error: 'This is a sealed keyring file. Never share it. Bring your City Key (the public key file) instead.' };

    const key = j.key && typeof j.key === 'object' ? j.key : (j.kind === VTA ? null : j);
    const rec = j.record && typeof j.record === 'object' ? j.record : (j.kind === VTA ? j : null);
    if (!key && !rec) return { ok: false, error: 'No City Key found in this file.' };

    const fields = [], warnings = [], checked = [];
    let kappa = null;
    if (key) {
      if (!key.identity || !E.isHex(key.identity.publicKeyHex || '', 64)) warnings.push('the key names no 32-byte public key; it reads as a practice or partial key');
      kappa = await E.kappaOf(key);
      checked.push('κ re-derived from the key');
      if (key.kappa && key.kappa !== kappa) return { ok: false, error: 'The key carries κ ' + key.kappa.slice(0, 20) + '…, but it re-derives to ' + kappa.slice(0, 20) + '…. It was changed after it was sealed.' };
      if (key.kappa) checked.push('the stamped κ matches');
      if (key.identity && E.isHex(key.identity.publicKeyHex || '', 64)) {
        const did = E.didKeyOf(key.identity.publicKeyHex);
        if (key.did && key.did !== did) return { ok: false, error: 'The key’s DID does not derive from its public key.' };
        fields.push(['did', did]); checked.push('did:key derives from the public key');
      }
      const count = (o, label) => { if (o && o.root) fields.push([label, o.root + (o.count != null ? ' · ' + o.count : '')]); };
      count(key.holds, 'holds root'); count(key.packets, 'packets root'); count(key.chains, 'chains root');
      if (key.journey && Array.isArray(key.journey.steps)) fields.push(['journey steps', String(key.journey.steps.length)]);
      if (Array.isArray(key.walks)) fields.push(['walks', String(key.walks.length)]);
      if (key.holds || key.packets || key.chains) warnings.push('holds, packets and chains are declared roots; their items are not in the key, so a keeper reads them as claims');
    }
    if (rec) {
      if (rec.kind !== VTA) return { ok: false, error: 'The record is not an agentprivacy.vta/1 record.' };
      if (!(await E.ed25519Available())) warnings.push('this browser cannot check Ed25519 signatures; try a current Chrome, Firefox or Safari');
      else {
        const msg = E.canonical({ kind: rec.kind, publicKeyHex: rec.publicKeyHex, kappa: rec.kappa, prior: rec.prior == null ? null : rec.prior, at: rec.at, walks: rec.walks == null ? 0 : rec.walks, vrcs: rec.vrcs || [] });
        let ok = false; try { ok = await E.verifySig(rec.publicKeyHex, msg, rec.sig); } catch (e) { ok = false; }
        if (!ok) return { ok: false, error: 'The VTA record’s signature does not verify.' };
        checked.push('the VTA record’s Ed25519 signature verifies');
      }
      if (kappa && rec.kappa !== kappa) return { ok: false, error: 'The record was signed over a different κ than this key.' };
      if (kappa) checked.push('the record names this key');
      kappa = kappa || rec.kappa;
      if (!fields.some(f => f[0] === 'did')) fields.push(['did', E.didKeyOf(rec.publicKeyHex)]);
      if (rec.at) fields.push(['signed at', rec.at]);
    } else warnings.push('no signed VTA record came with the key; add it to show the key is yours (the Swordsman’s vta_publish emits it)');

    const hex = kappa.replace(/^sha256:/, '');
    return { ok: true, root: kappa, sigil: E.glyphs(hex), seal: E.seal(hex), fields, checked, warnings,
      send: { kappa, did: (fields.find(f => f[0] === 'did') || [])[1] || null, record: rec || null } };
  }
  globalThis.CityEvidence.verifiers.cityKey = check;
})();
