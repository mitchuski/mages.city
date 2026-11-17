// evidence/common.js · shared checks for the Mages City evidence window. WebCrypto only; nothing is fetched.
// Ported from mages_city site/record.js (canonical, κ, did:key, Ed25519) and agentprivacy_master src/lib/stars.ts
// (chain fold, emoji glyphs). The Sigil seal comes from evidence/sigilcode.js (Sigil 0.1.1).
(() => {
  'use strict';
  const enc = new TextEncoder();
  const subtle = () => { const s = globalThis.crypto && globalThis.crypto.subtle; if (!s) throw new Error('this browser cannot check evidence (no WebCrypto)'); return s; };
  const toHex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  const bytesOf = h => new Uint8Array((h.match(/../g) || []).map(b => parseInt(b, 16)));
  const isHex = (s, n) => typeof s === 'string' && new RegExp('^[0-9a-f]{' + n + '}$', 'i').test(s);

  async function sha256hex(text) { return toHex(await subtle().digest('SHA-256', enc.encode(text))); }

  // Law-L5 canonical form: keys sorted recursively, no whitespace, `exclude` dropped at the top level.
  function canonical(value, exclude) {
    const canon = v => {
      if (v === null || typeof v !== 'object') return JSON.stringify(v);
      if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
      return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
    };
    const c = Object.assign({}, value); for (const k of exclude || []) delete c[k];
    return canon(c);
  }
  const kappaOf = async key => 'sha256:' + await sha256hex(canonical(key, ['kappa']));

  const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function base58(bytes) {
    let digits = [0];
    for (const byte of bytes) { let carry = byte; for (let i = 0; i < digits.length; i++) { carry += digits[i] << 8; digits[i] = carry % 58; carry = (carry / 58) | 0; } while (carry) { digits.push(carry % 58); carry = (carry / 58) | 0; } }
    for (const byte of bytes) { if (byte === 0) digits.push(0); else break; }
    let out = ''; for (let i = digits.length - 1; i >= 0; i--) out += B58[digits[i]]; return out;
  }
  const didKeyOf = pk => 'did:key:z' + base58(new Uint8Array([0xed, 0x01, ...bytesOf(pk)]));

  async function verifySig(pk, message, sigHex) {
    const key = await subtle().importKey('raw', bytesOf(pk), { name: 'Ed25519' }, false, ['verify']);
    return subtle().verify({ name: 'Ed25519' }, key, bytesOf(sigHex), enc.encode(message));
  }
  async function ed25519Available() {
    try { await subtle().importKey('raw', new Uint8Array(32), { name: 'Ed25519' }, false, ['verify']); return true; }
    catch (e) { return !/not supported|unrecognized|NotSupported/i.test(String(e && (e.name + e.message))); }
  }

  // root = sha256(root + "|" + hash), from 64 zeros, in order (stars.ts, the HH worker)
  async function foldRoot(hashes) { let r = '0'.repeat(64); for (const h of hashes) r = await sha256hex(r + '|' + h); return r; }

  // the four-glyph emoji mark (16 bits, decoration only) and the Sigil 0.1.1 seal (the check)
  const GLYPHS = ['🐬', '🧭', '🌌', '🧣', '🛸', '🐭', '🌍', '⭐', '🌀', '🔭', '🗝️', '🕯️', '🪐', '🌙', '🔥', '🌊'];
  const glyphs = h => [0, 1, 2, 3].map(i => GLYPHS[parseInt(h[i], 16)]).join('');
  function seal(hex64) {
    try { return globalThis.SigilCode ? globalThis.SigilCode.encode(bytesOf(hex64)) : null; } catch (e) { return null; }
  }
  function parseJSON(raw) {
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  globalThis.EvidenceCommon = Object.freeze({ sha256hex, canonical, kappaOf, didKeyOf, verifySig, ed25519Available, foldRoot, glyphs, seal, parseJSON, isHex, bytesOf });
})();
