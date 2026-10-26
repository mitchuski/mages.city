// kappa.js — the κ rule in the browser: the kappa-label of a value is "sha256:" + sha256(its canonical dCBOR bytes),
// the same rule as kappa_evidence_mage/kappa.py (and the UOR κ-registry it re-implements): null/bools as simples,
// integers in their shortest head, floats by numeric reduction then the shortest exact f16/f32/f64, text NFC-normalised,
// arrays in order, maps with keys sorted by their encoded bytes. Held to kappa.py on every page of the guide's
// registry (2,386 pages) before the seal reader relies on it. Also: the packets fold the registries use.
(function () {
  "use strict";
  const te = new TextEncoder();
  function head(major, n) {
    if (n < 24) return [(major << 5) | n];
    if (n < 0x100) return [(major << 5) | 24, n];
    if (n < 0x10000) return [(major << 5) | 25, n >> 8, n & 255];
    if (n < 0x100000000) return [(major << 5) | 26, (n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    const hi = Math.floor(n / 0x100000000), lo = n >>> 0;
    return [(major << 5) | 27, (hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255];
  }
  const int = i => i >= 0 ? head(0, i) : head(1, -1 - i);
  function f16bits(x) {   // exact float -> IEEE half bits, or null when x is not exactly representable as a half
    if (x === 0) return Object.is(x, -0) ? 0x8000 : 0;
    const s = x < 0 ? 1 : 0, a = Math.abs(x); let e = Math.floor(Math.log2(a)), m;
    if (2 ** e > a) e--; if (2 ** (e + 1) <= a) e++;
    if (e > 15) return null;
    if (e >= -14) { m = (a / 2 ** e - 1) * 1024; if (!Number.isInteger(m)) return null; return (s << 15) | ((e + 15) << 10) | m; }
    m = a / 2 ** -24; if (!Number.isInteger(m) || m >= 1024) return null; return (s << 15) | m;
  }
  function float(x) {
    if (Number.isNaN(x)) return [0xf9, 0x7e, 0x00];
    if (x === Infinity) return [0xf9, 0x7c, 0x00]; if (x === -Infinity) return [0xf9, 0xfc, 0x00];
    if (Number.isInteger(x) && Math.abs(x) < 2 ** 64) return int(x);   // numeric reduction (covers -0)
    const b4 = new DataView(new ArrayBuffer(4)); b4.setFloat32(0, x);
    if (b4.getFloat32(0) === x) { const h = f16bits(x); if (h !== null) return [0xf9, h >> 8, h & 255]; return [0xfa, ...new Uint8Array(b4.buffer)]; }
    const b8 = new DataView(new ArrayBuffer(8)); b8.setFloat64(0, x); return [0xfb, ...new Uint8Array(b8.buffer)];
  }
  const cmp = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; };
  const put = (out, bytes) => { for (let i = 0; i < bytes.length; i++) out.push(bytes[i]); return out; };
  function enc(v, out) {   // appends v's canonical bytes to out (no spreading: large pages would overflow the stack)
    if (v === null || v === undefined) { out.push(0xf6); return out; }
    if (v === true) { out.push(0xf5); return out; } if (v === false) { out.push(0xf4); return out; }
    if (typeof v === "number") return put(out, Number.isInteger(v) ? int(v) : float(v));
    if (typeof v === "string") { const b = te.encode(v.normalize("NFC")); put(out, head(3, b.length)); return put(out, b); }
    if (Array.isArray(v)) { put(out, head(4, v.length)); for (const x of v) enc(x, out); return out; }
    if (typeof v === "object") {
      const items = Object.entries(v).map(([k, x]) => [enc(k, []), enc(x, [])]).sort((a, b) => cmp(a[0], b[0]));
      put(out, head(5, items.length)); for (const [k, x] of items) { put(out, k); put(out, x); } return out;
    }
    throw new TypeError("no dCBOR encoding for " + typeof v);
  }
  const encode = v => { const out = []; enc(v, out); return out; };
  const hexOf = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  const sha = async bytes => "sha256:" + hexOf(await crypto.subtle.digest("SHA-256", bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes)));
  const kappaOf = v => sha(encode(v));
  async function packets(items) {   // sorted, sha256(a|b), the odd node promoted: the City Key's rule, and the registries'
    let lv = items.filter(x => x).slice().sort(); if (!lv.length) return null;
    while (lv.length > 1) { const nx = []; for (let i = 0; i < lv.length; i += 2) nx.push(i + 1 < lv.length ? await sha(te.encode(lv[i] + "|" + lv[i + 1])) : lv[i]); lv = nx; }
    return lv[0];
  }
  // a guide page's content, as the registry names it: its title and story, items without their random ids
  const guideContent = page => ({ title: page.title || "", story: (page.story || []).filter(it => it && typeof it === "object").map(it => { const o = {}; for (const k in it) if (k !== "id") o[k] = it[k]; return o; }) });
  globalThis.Kappa = Object.freeze({ encode, kappaOf, sha, packets, guideContent });
})();
