// sealcheck.js — check two seals against each other, the same on mages.city (sigil.mages.city, /seal.html) and
// soulbis.com/sigil. A seal is a 32-byte hash written as one word of 26 characters (Sigil, johnservil/sigil,
// pinned beside this file): the check means one changed character, or two swapped, no longer reads.
// Each side takes a hash (64 hex, with or without sha256:/blake3:) or a seal; the comparison says what the two
// share — characters in place, leading bits, the bits that differ, and where both sit on the City's 64 states
// (first six bits, Protection 32 … Value 1, lib/lattice-vertex.ts). Runs in the browser; sends nothing.
// usage: SealCheck.mount(el, { index: "seals.json" | null, local: bool, labels: {a, b}, extra: {a: [{label, fill}]}, home: html,
//          registry: "guide-registry.json" (needs sigil/kappa.js loaded), guideLocal: base url of a local guide snapshot })
(function () {
  "use strict";
  const S = globalThis.SigilCode;
  const DIMS = ["protection", "delegation", "memory", "connection", "computation", "value"];
  const CSS = `
.sc{--sc-line:var(--line,#273047);--sc-muted:var(--muted,#a8b1c3);--sc-fg:var(--fg,#eeeef2);--sc-a:#9fd6db;--sc-b:#e5a49c;--sc-panel:var(--panel,#0e1422)}
.sc .sc-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:760px){.sc .sc-two{grid-template-columns:1fr}}
.sc .sc-side{background:var(--sc-panel);border:1px solid var(--sc-line);border-radius:12px;padding:14px 16px;min-width:0}
.sc .sc-tag{font:10px/1.8 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--sc-muted)}
.sc .sc-tag i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:middle}
.sc textarea{width:100%;background:#0a1020;border:1px solid #45516a;border-radius:6px;color:#e9edf5;padding:9px 10px;font:13px/1.45 ui-monospace,Menlo,Consolas,monospace;resize:vertical;margin-top:6px;box-sizing:border-box}
.sc .sc-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px}
.sc .sc-btn{font:inherit;font-size:12px;background:#121a2b;color:var(--sc-fg);border:1px solid var(--sc-line);border-radius:8px;padding:5px 10px;cursor:pointer}.sc .sc-btn:hover{border-color:var(--sc-a)}
.sc .sg,.sc .sc-seal{font-family:"Noto Sans","Noto Sans Ethiopic","Noto Sans Canadian Aboriginal","Segoe UI","Segoe UI Historic",system-ui,sans-serif;letter-spacing:.08em;color:var(--sc-fg);overflow-wrap:anywhere}
.sc .sc-seal{font-size:clamp(20px,3vw,30px);line-height:1.35;margin-top:10px}
.sc .sc-seal span.same{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:5px}
.sc .sc-side.a .sc-seal span.same{color:var(--sc-a)}.sc .sc-side.b .sc-seal span.same{color:var(--sc-b)}
.sc .sc-seal span.bad{color:#ff6b5a;text-decoration:underline wavy}
.sc .sc-hex{font:12px ui-monospace,Menlo,Consolas,monospace;color:var(--sc-muted);word-break:break-all;margin-top:4px}
.sc .sc-v{font-size:13px;margin-top:6px}.sc .ok{color:var(--sc-a)}.sc .bad{color:#ff8a7a}.sc .quiet{font-size:12.5px;color:var(--sc-muted)}
.sc .sc-place{font-size:12.5px;color:var(--sc-muted);margin-top:4px}.sc .sc-place b{color:var(--sc-fg);font-weight:500}
.sc .sc-cmp{background:var(--sc-panel);border:1px solid var(--sc-line);border-radius:12px;padding:14px 16px;margin-top:14px;display:grid;grid-template-columns:minmax(0,1fr) 190px;gap:14px}@media(max-width:760px){.sc .sc-cmp{grid-template-columns:1fr}}
.sc .sc-facts{font-size:13.5px;line-height:1.75;color:var(--sc-fg)}.sc .sc-facts .k{color:var(--sc-muted)}
.sc .sc-bits{font:11px/1.5 ui-monospace,monospace;color:var(--sc-muted);word-break:break-all;margin-top:6px}.sc .sc-bits b{color:#f3d27a;font-weight:400}
.sc .sc-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:2px}.sc .sc-grid div{aspect-ratio:1;border:1px solid #1c2538;border-radius:2px;background:#0a1020;position:relative}
.sc .sc-grid div.a{background:var(--sc-a)}.sc .sc-grid div.b{background:var(--sc-b)}.sc .sc-grid div.ab{background:#fff}.sc .sc-grid div.nb{border-color:#f3d27a}
.sc .sc-chain{font-size:12.5px;margin-top:4px;line-height:1.7}.sc .sc-found{border-top:1px solid var(--sc-line);padding:8px 0 0;margin-top:8px;font-size:13px}.sc .sc-found .kind{font:10.5px monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--sc-a);margin-right:6px}
.sc .hx{display:inline-block;vertical-align:middle;margin-right:8px}`;

  const hexOf = (b) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  const bytesOf = (h) => Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16)));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const word = (v) => v.toString(2).padStart(3, "0");
  const vertexOf = (hex) => parseInt(hex.slice(0, 2), 16) >> 2;
  const on6 = (v) => DIMS.filter((_, i) => (v >> (5 - i)) & 1);
  const pop = (x) => { let n = 0; while (x) { n += x & 1; x >>>= 1; } return n; };

  function parse(t) {
    t = String(t || "").trim(); if (!t) return null;
    const m = t.match(/^(?:(sha256|blake3|sha3|poseidon):)?([0-9a-fA-F]{64})$/);
    if (m) { const hex = m[2].toLowerCase(); return { alg: m[1] || "", hex, seal: S.encode(bytesOf(hex)), from: "hash" }; }
    const seal = t.replace(/\s+/g, "");
    try { const d = S.decode(seal, 32); return { alg: "", hex: hexOf(d), seal, from: "seal" }; }
    catch (e) { return { error: (e && e.message) || "does not read", seal, from: "seal" }; }
  }
  function hexSVG(hex, size, col) {
    const v = vertexOf(hex), w = size, h = size, lh = h / 8; let s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">`;
    for (let i = 0; i < 6; i++) { const y = i * (h / 6) + lh / 3, bit = (v >> (5 - i)) & 1;
      s += bit ? `<rect x="0" y="${y}" width="${w}" height="${lh}" fill="${col}"/>` : `<rect x="0" y="${y}" width="${w * 0.42}" height="${lh}" fill="${col}"/><rect x="${w * 0.58}" y="${y}" width="${w * 0.42}" height="${lh}" fill="${col}"/>`; }
    return s + "</svg>";
  }
  function bitsOf(hex) { return hex.split("").map((c) => parseInt(c, 16).toString(2).padStart(4, "0")).join(""); }

  function mount(root, opt) {
    opt = opt || {};
    if (!document.getElementById("sc-css")) { const st = document.createElement("style"); st.id = "sc-css"; st.textContent = CSS; document.head.appendChild(st); }
    const L = Object.assign({ a: "one", b: "two" }, opt.labels || {});
    let INDEX = null;
    const side = (id, col) => `<div class="sc-side ${id}"><div class="sc-tag"><i style="background:${col}"></i>${esc(L[id])}</div>
      <textarea data-f="${id}" rows="2" placeholder="a hash (64 hex, sha256: or blake3: optional) or a seal (26 characters)"></textarea>
      <div class="sc-row"><button class="sc-btn" data-act="random" data-f="${id}" type="button">random</button><button class="sc-btn" data-act="flip" data-f="${id}" type="button" title="change one character of the seal, to see the check refuse it">change one character</button><button class="sc-btn" data-act="seal" data-f="${id}" type="button">copy seal</button><button class="sc-btn" data-act="hex" data-f="${id}" type="button">copy hash</button>${((opt.extra || {})[id] || []).map((x, i) => `<button class="sc-btn" data-act="extra" data-i="${i}" data-f="${id}" type="button">${esc(x.label)}</button>`).join("")}<span class="quiet" data-note="${id}"></span></div>
      <div class="sc-seal" data-seal="${id}"></div><div class="sc-hex" data-hex="${id}"></div><div class="sc-place" data-place="${id}"></div><div class="sc-v" data-v="${id}"></div><div data-found="${id}"></div></div>`;
    root.classList.add("sc");
    root.innerHTML = `<div class="sc-two">${side("a", "#9fd6db")}${side("b", "#e5a49c")}</div>
      <div class="sc-cmp"><div><div class="sc-tag">what the two share</div><div class="sc-facts" data-cmp>put a hash or a seal on both sides</div><div class="sc-bits" data-bits></div></div>
      <div><div class="sc-tag">where they sit · 64 states</div><div class="sc-grid" data-grid>${Array.from({ length: 64 }, (_, i) => `<div data-s="${i}" title="V${i} · ${word(i >> 3)}${word(i & 7)}"></div>`).join("")}</div>
      <div class="quiet" style="margin-top:4px"><span style="color:#9fd6db">■</span> one · <span style="color:#e5a49c">■</span> two · <span style="color:#fff">■</span> both · <span style="color:#f3d27a">□</span> one step from one</div></div></div>
      <div class="quiet" style="margin-top:8px">seals written with <a href="https://github.com/johnservil/sigil" style="color:#9fd6db">Sigil</a> (johnservil/sigil, pinned 8bd993a) · the check runs in your browser and sends nothing${opt.home ? ` · ${opt.home}` : ""}</div>`;
    const q = (sel) => root.querySelector(sel), field = (id) => q(`textarea[data-f="${id}"]`);
    if (opt.index) fetch(opt.index, { cache: "no-store" }).then((r) => r.json()).then((j) => { INDEX = j; read("a"); read("b"); }).catch(() => { INDEX = { index: {} }; });

    function found(hex) {
      if (!opt.index) return "";
      if (!INDEX) return '<div class="sc-found quiet">reading the City’s index…</div>';
      const hits = INDEX.index["sha256:" + hex] || INDEX.index[hex] || [];
      if (!hits.length) return '<div class="sc-found quiet">not on record in the City’s chains at the last build. It may be a leaf inside an entry: open that chain and fold the entry.</div>';
      const g = new Map(); hits.forEach((h) => { const k = h.kind + "|" + (h.label || "") + "|" + (h.entry || ""); if (!g.has(k)) g.set(k, { ...h, chains: [] }); { const c = { chain: h.chain, href: opt.local ? h.local : h.url }, L = g.get(k).chains, at = L.findIndex(x => x.chain === c.chain);
        // one door per chain: a family drawn on several hash sites opens on its own (sha256.mages.city for SHA-256)
        const own = u => String(u).includes("//" + String(c.chain).toLowerCase().replace(/[^a-z0-9]/g, "") + ".");
        if (at < 0) L.push(c); else if (own(h.url) && !own(L[at].href)) L[at] = c; } });
      return [...g.values()].map((x) => `<div class="sc-found"><span class="kind">${esc(x.kind)}</span>${x.chains.map((c) => `<b>${esc(c.chain)}</b> <a href="${esc(c.href)}">open →</a>`).join(" · ")}${x.scroll ? ` · <a href="${esc(x.scroll)}">in the guide's scroll →</a>` : ""}${x.snapshot ? ` · snapshot ${esc(x.snapshot)}` : ""}${x.label ? " · " + esc(x.label) : ""}${x.entry ? " · under " + esc(x.entry) : ""}${x.site ? `<div class="sc-chain" data-chain="${esc(hex)}" data-site="${esc(x.site)}" data-slug="${esc(x.slug || "")}" data-json="${esc(x.json || "")}" data-kind="${esc(x.kind)}">re-deriving through the guide's registry…</div>` : ""}</div>`).join("");
    }
    // ---- the guide's κ-registry, re-derived here: every step is recomputed in this browser, nothing is taken on trust
    let REG = null;
    const regLoad = () => REG || (REG = opt.registry && globalThis.Kappa ? fetch(opt.registry, { cache: "no-store" }).then(r => r.json()) : Promise.reject(new Error("no registry")));
    async function chain(el) {
      const K = globalThis.Kappa, hex = el.dataset.chain, site = el.dataset.site, slug = el.dataset.slug, kind = el.dataset.kind, step = [];
      const mark = (ok, t) => step.push(`<span class="${ok === true ? "ok" : ok === false ? "bad" : "quiet"}">${ok === true ? "✓" : ok === false ? "✗" : "·"} ${t}</span>`);
      const draw = () => { el.innerHTML = step.join(' <span class="quiet">→</span> '); };
      try {
        const R = await regLoad(), k = "sha256:" + hex;
        if (kind === "guide page" || kind === "sealed gate") {
          if (kind === "guide page" && el.dataset.json) {
            let url = el.dataset.json; if (opt.local && opt.guideLocal) url = url.replace("https://guide.agentprivacy.ai/", opt.guideLocal);
            try { const page = await (await fetch(url, { cache: "no-store" })).json(), now = await K.kappaOf(K.guideContent(page));
              mark(now === k, now === k ? "the published page is this hash" : `the page has changed since this snapshot (now ${now.slice(7, 19)}…)`); }
            catch (e) { mark(null, "the page could not be fetched here, so its content was not re-checked"); }
          }
          const S = R.site_roots[site], mine = R.entries.filter(e => e.site === site);
          const leaf = mine.some(e => e.slug === slug && e.k === k);
          const root = await K.packets(mine.map(e => e.slug + "|" + e.k));
          mark(leaf && root === S.root, `one of ${S.count} in its site, which folds to its root`);
        } else if (kind === "guide site root") {
          const mine = R.entries.filter(e => e.site === site), root = await K.packets(mine.map(e => e.slug + "|" + e.k));
          mark(root === k && R.site_roots[site] && R.site_roots[site].root === k, `the root of ${mine.length} pages, re-derived`);
        }
        const fed = await K.packets(Object.entries(R.site_roots).sort((a, b) => a[0] < b[0] ? -1 : 1).map(([i, s]) => i + "|" + s.root));
        mark(fed === R.federation_root && (kind !== "guide federation root" || fed === k), `${Object.keys(R.site_roots).length} sites fold to the federation root`);
        const head = { schema: R.schema, snapshot: R.snapshot, federation_root: R.federation_root, prior: R.prior, sites: R.sites, pages: R.pages };
        const rr = await K.kappaOf(head); mark(rr === R.root && (kind !== "guide registry root" || rr === k), `the registry root of ${R.snapshot} re-derives`);
      } catch (e) { mark(null, "the guide's registry is not loaded on this page"); }
      draw();
    }
    function read(id) {
      const r = parse(field(id).value), sl = q(`[data-seal="${id}"]`), hx = q(`[data-hex="${id}"]`), pl = q(`[data-place="${id}"]`), v = q(`[data-v="${id}"]`), fd = q(`[data-found="${id}"]`);
      if (!r) { sl.textContent = hx.textContent = pl.textContent = v.textContent = ""; fd.innerHTML = ""; }
      else if (r.error) { sl.textContent = r.seal; hx.textContent = ""; pl.textContent = ""; fd.innerHTML = "";
        v.innerHTML = `<span class="bad">✗ does not read: ${esc(r.error)}. A changed, missing or swapped character fails the check; a hash never decodes to a different hash by accident.</span>`; }
      else { const col = id === "a" ? "#9fd6db" : "#e5a49c", vx = vertexOf(r.hex);
        sl.innerHTML = `<span class="hx">${hexSVG(r.hex, 26, col)}</span>` + [...r.seal].map((c) => `<span>${esc(c)}</span>`).join("");
        hx.textContent = (r.alg || "sha256") + ":" + r.hex;
        pl.innerHTML = `sits at <b>V${vx}</b> · house <b>${word(vx >> 3)}</b> · place <b>${word(vx & 7)}</b> · ${on6(vx).join(", ") || "none of the six"}`;
        v.innerHTML = r.from === "hash" ? '<span class="ok">✓ written as its seal; it reads back to the same 32 bytes</span>' : '<span class="ok">✓ the seal reads; the check holds</span>';
        fd.innerHTML = found(r.hex); fd.querySelectorAll(".sc-chain").forEach(el => chain(el)); }
      cmp(); if (opt.onChange) try { opt.onChange(id, r); } catch (e) {}
    }
    function cmp() {
      const a = parse(field("a").value), b = parse(field("b").value), out = q("[data-cmp]"), bits = q("[data-bits]");
      root.querySelectorAll("[data-grid] div").forEach((d) => (d.className = ""));
      root.querySelectorAll(".sc-seal span.same").forEach((s) => s.classList.remove("same"));
      const okA = a && !a.error, okB = b && !b.error;
      const va = okA ? vertexOf(a.hex) : null, vb = okB ? vertexOf(b.hex) : null;
      const mark = (v, c) => { const d = q(`[data-grid] div[data-s="${v}"]`); if (d) d.classList.add(c); };
      if (okA) { mark(va, "a"); for (let i = 0; i < 6; i++) mark(va ^ (1 << i), "nb"); }
      if (okB) { if (okA && va === vb) { const d = q(`[data-grid] div[data-s="${vb}"]`); d.className = "ab"; } else mark(vb, "b"); }
      if (!okA || !okB) { out.innerHTML = (a && a.error) || (b && b.error) ? '<span class="bad">one side does not read; fix it to compare</span>' : "put a hash or a seal on both sides"; bits.textContent = ""; return; }
      if (a.hex === b.hex) { out.innerHTML = '<span class="ok">the same hash: the same seal, the same place</span>' + (a.alg && b.alg && a.alg !== b.alg ? ` <span class="bad">· but labelled ${esc(a.alg)} and ${esc(b.alg)}</span>` : "");
        root.querySelectorAll(".sc-seal span:not(.hx)").forEach((s) => s.classList.add("same")); bits.textContent = ""; return; }
      const x = [...a.seal], y = [...b.seal]; let same = 0;
      const spansA = root.querySelectorAll('[data-seal="a"] span:not(.hx)'), spansB = root.querySelectorAll('[data-seal="b"] span:not(.hx)');
      y.forEach((c, i) => { if (x[i] === c) { same++; if (spansA[i]) spansA[i].classList.add("same"); if (spansB[i]) spansB[i].classList.add("same"); } });
      const ba = bitsOf(a.hex), bb = bitsOf(b.hex); let pre = 0; while (pre < 256 && ba[pre] === bb[pre]) pre++;
      let diff = 0; for (let i = 0; i < 256; i++) if (ba[i] !== bb[i]) diff++;
      const d6 = pop(va ^ vb);
      const place = va === vb ? "<b>the same vertex</b>, V" + va : (va >> 3) === (vb >> 3) ? `the same house ${word(va >> 3)}, ${d6 === 1 ? "neighbouring places" : "different places"}` : d6 === 1 ? "neighbours: one dimension apart" : `${d6} of 6 dimensions apart (V${va} · V${vb})`;
      out.innerHTML = `<span class="k">characters in place</span> ${same} of 26 <span class="quiet">(chance alone: about 0.02)</span><br><span class="k">leading bits shared</span> ${pre} <span class="quiet">(chance alone: about 1)</span><br><span class="k">bits that differ</span> ${diff} of 256 <span class="quiet">(two unrelated hashes: about 128)</span><br><span class="k">on the lattice</span> ${place}`;
      bits.innerHTML = pre ? `the shared prefix: <b>${ba.slice(0, pre)}</b>${ba.slice(pre, Math.min(256, pre + 24))}…` : "";
    }
    root.addEventListener("input", (e) => { const f = e.target.getAttribute && e.target.getAttribute("data-f"); if (f) read(f); });
    root.addEventListener("click", (e) => {
      const b = e.target.closest && e.target.closest("[data-act]"); if (!b) return; const id = b.dataset.f, act = b.dataset.act, note = q(`[data-note="${id}"]`), fl = field(id);
      if (act === "random") { fl.value = hexOf(crypto.getRandomValues(new Uint8Array(32))); read(id); }
      else if (act === "flip") { let r = parse(fl.value); if (!r || r.error) { fl.value = hexOf(crypto.getRandomValues(new Uint8Array(32))); r = parse(fl.value); }
        const cs = [...r.seal], i = Math.floor(Math.random() * cs.length), pool = [...S.encode(crypto.getRandomValues(new Uint8Array(32)))].filter((c) => c !== cs[i]);
        cs[i] = pool[0]; fl.value = cs.join(""); read(id);
        const sp = root.querySelectorAll(`[data-seal="${id}"] span`); if (sp[i]) sp[i].classList.add("bad"); note.textContent = "character " + (i + 1) + " changed"; }
      else if (act === "seal" || act === "hex") { const r = parse(fl.value); if (!r || r.error) return; const t = act === "seal" ? r.seal : (r.alg || "sha256") + ":" + r.hex;
        navigator.clipboard.writeText(t).then(() => (note.textContent = act + " copied")).catch(() => {}); }
      else if (act === "extra") { const x = ((opt.extra || {})[id] || [])[+b.dataset.i]; if (x) { const v = x.fill(); if (v) { fl.value = v; read(id); } else note.textContent = x.empty || ""; } }
    });
    return { set(id, v) { field(id).value = v || ""; read(id); }, read, parse };
  }
  globalThis.SealCheck = Object.freeze({ mount, parse, vertexOf });
})();
