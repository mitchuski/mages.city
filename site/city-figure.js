// city-figure.js · the City on the lattice manifold Star. Same interface as star-figure.js
// (createStarFigure(canvas, { spinning, onPlaceHover, onPlaceClick }) → { setLayers, setSpinning }),
// so ring.js only changes its import. What the figure says:
//   the manifold sphere is the City's boundary · the star tetrahedron is its two sides held together:
//   coral ⚔️ keepers (protection, the ground: nodes, hearths, VTC/VTA) and cyan 🧙 mages (delegation, the work) ·
//   the 64-point lattice at the core, its middle stratum violet ⿻: the people, the gap that chooses ·
//   one gold root above (the community DID) · the door below, arrivals bringing evidence in ·
//   the Scriptorium: an orbit of sealed scrolls · beyond: other communities a City mage travels to.
// Display only: every place is a real link; nothing here is a score.

const TAU = Math.PI * 2;
const C = { coral: [232, 139, 118], cyan: [127, 208, 214], violet: [169, 155, 224], gold: [229, 182, 92], mesh: [143, 165, 218], star: [168, 189, 233], ink: [238, 238, 242] };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function createStarFigure(canvas, opts = {}) {
  const ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return { setLayers() {}, setSpinning() {} };
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let spinning = opts.spinning !== false && !reduce;
  let w = 0, h = 0, dpr = 1, R = 1;
  let yaw = 0.6, pitch = -0.32, t = 0, last = 0, raf = 0, visible = true;
  let places = [], scrolls = [], hover = null, drag = null, dragged = false;

  // ---------- fixed geometry (unit sphere space) ----------
  const r = rnd(708);
  const stars = Array.from({ length: 170 }, () => ({ a: r() * TAU, d: 0.15 + r() * 1.05, s: 0.4 + r() * 1.2, o: 0.12 + r() * 0.45, tw: r() * TAU }));
  const s3 = 1 / Math.sqrt(3);
  const TETRA = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v => v.map(x => x * s3 * 0.62));
  const KEEP = TETRA.map(v => v.map(x => -x));          // ⚔️ coral
  const MAGE = TETRA;                                     // 🧙 cyan
  const EDGES = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  // 6-cube → 3D: six directions on a cuboctahedral spread, scaled into the core
  const DIRS = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0.5, 0.5, -0.7], [-0.5, 0.7, 0.5], [0.7, -0.5, 0.5]];
  const LATTICE = [];
  for (let v = 0; v < 64; v++) {
    const bits = [0, 1, 2, 3, 4, 5].map(i => (v >> (5 - i)) & 1);
    const p = [0, 0, 0]; bits.forEach((b, i) => { if (b) for (let k = 0; k < 3; k++) p[k] += DIRS[i][k]; });
    LATTICE.push({ v, bits, w: bits.reduce((a, b) => a + b, 0), p });
  }
  const mean = [0, 1, 2].map(k => LATTICE.reduce((a, q) => a + q.p[k], 0) / 64);
  LATTICE.forEach(q => { q.p = q.p.map((x, k) => (x - mean[k]) * 0.13); });
  const LEDGES = [];
  LATTICE.forEach(q => q.bits.forEach((b, i) => { if (!b) LEDGES.push([q.v, q.v | (1 << (5 - i))]); }));
  const ROOT = [0, 0.86, 0];
  const DOOR = [0, -0.92, 0.28];
  const ORBIT_TILT = 0.38, ORBIT_R = 1.22;
  const orbitPt = a => { const x = Math.cos(a) * ORBIT_R, z = Math.sin(a) * ORBIT_R; return [x, z * Math.sin(ORBIT_TILT), z * Math.cos(ORBIT_TILT)]; };
  const FAR = [[-1.55, 0.62, -0.4], [1.6, 0.35, -0.6], [-1.35, -0.75, 0.5], [1.45, -0.9, 0.2], [0.2, 1.45, -0.7]];
  const ARRIVALS = Array.from({ length: 9 }, (_, i) => ({ off: i / 9, lane: (i % 3) - 1 }));

  // where places sit: by id, else spread over the mage and keeper vertices
  const SEAT = {
    community: () => DOOR, starkey: () => [0, 0.02, 0.06], setup: () => [0, -0.1, 0],
    arena: a => orbitPt(0.7 + a * 0.2), swarms: a => orbitPt(2.4 + a * 0.2), hosting: () => KEEP[0],
    guide: () => MAGE[0], spellbook: () => MAGE[2],
  };
  const seat = (p, i) => (SEAT[p.id] ? SEAT[p.id](i * 0.001) : (i % 2 ? KEEP : MAGE)[(i >> 1) % 4]);

  // ---------- projection ----------
  function rot(p) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x = p[0] * cy + p[2] * sy, z0 = -p[0] * sy + p[2] * cy;
    return [x, p[1] * cp - z0 * sp, p[1] * sp + z0 * cp];
  }
  function proj(p) {
    const q = rot(p), k = R * (1 + q[2] * 0.12);
    return { x: w / 2 + q[0] * k, y: h / 2 - q[1] * k, z: q[2] };
  }
  const line = (a, b, col, alpha, width = 1, dash) => {
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = rgba(col, alpha); ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
  };
  const dot = (p, rad, col, alpha, glow) => {
    if (glow) { const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 4); g.addColorStop(0, rgba(col, alpha * 0.55)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rad * 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = rgba(col, alpha); ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, TAU); ctx.fill();
  };
  const label = (p, txt, col, alpha, dy = 0, size = 10) => {
    ctx.font = `${size * dpr}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    ctx.fillStyle = rgba(col, alpha); ctx.textAlign = 'center'; ctx.fillText(txt, p.x, p.y + dy * dpr);
  };

  function resize() {
    const box = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.width = Math.max(1, Math.round(box.width * dpr));
    h = canvas.height = Math.max(1, Math.round(box.height * dpr));
    R = Math.min(w, h) * 0.34;
  }

  // ---------- draw ----------
  function draw() {
    ctx.clearRect(0, 0, w, h);
    // haze
    const hz = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, R * 1.9);
    hz.addColorStop(0, 'rgba(55,84,160,.22)'); hz.addColorStop(0.6, 'rgba(35,55,92,.08)'); hz.addColorStop(1, 'rgba(8,12,24,0)');
    ctx.fillStyle = hz; ctx.fillRect(0, 0, w, h);
    // starfield (screen space, slow parallax with yaw)
    for (const s of stars) {
      const a = s.a + yaw * 0.05, d = s.d * Math.min(w, h) * 0.62;
      dot({ x: w / 2 + Math.cos(a) * d, y: h / 2 + Math.sin(a) * d }, s.s * dpr * 0.6, C.star, s.o * (0.75 + 0.25 * Math.sin(t * 0.8 + s.tw)));
    }
    // beyond: communities a City mage travels to
    const far = FAR.map(proj);
    far.forEach((f, i) => {
      dot(f, 2.6 * dpr, C.ink, 0.55, true);
      const from = proj(MAGE[i % 4]);
      const mid = { x: (from.x + f.x) / 2 + (f.y - from.y) * 0.18, y: (from.y + f.y) / 2 - (f.x - from.x) * 0.18 };
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.quadraticCurveTo(mid.x, mid.y, f.x, f.y);
      ctx.strokeStyle = rgba(C.cyan, 0.16); ctx.lineWidth = dpr; ctx.setLineDash([2 * dpr, 6 * dpr]); ctx.stroke(); ctx.setLineDash([]);
      const u = (t * 0.09 + i * 0.21) % 1, v = 1 - u;
      dot({ x: v * v * from.x + 2 * v * u * mid.x + u * u * f.x, y: v * v * from.y + 2 * v * u * mid.y + u * u * f.y }, 1.8 * dpr, C.cyan, 0.9, true);
    });
    label({ x: far[1].x, y: far[1].y }, 'other communities', C.ink, 0.45, 16, 9);
    // manifold: rippled lat/long mesh
    ctx.lineWidth = 0.6 * dpr;
    const ripple = (lat, lon) => 1 + 0.03 * Math.sin(6 * lon + 2 * lat + t * 0.4);
    const sph = (lat, lon) => { const rr = ripple(lat, lon); return [rr * Math.cos(lat) * Math.cos(lon), rr * Math.sin(lat), rr * Math.cos(lat) * Math.sin(lon)]; };
    for (let k = -3; k <= 3; k++) {
      const lat = k * 0.38; ctx.beginPath();
      for (let j = 0; j <= 64; j++) { const p = proj(sph(lat, j / 64 * TAU)); j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
      ctx.strokeStyle = rgba(C.mesh, 0.1 + 0.04 * (3 - Math.abs(k)) / 3); ctx.stroke();
    }
    for (let m = 0; m < 12; m++) {
      const lon = m / 12 * Math.PI; ctx.beginPath();
      for (let j = 0; j <= 40; j++) { const p = proj(sph(-1.45 + j / 40 * 2.9, lon)); j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
      ctx.strokeStyle = rgba(C.mesh, 0.1); ctx.stroke();
    }
    // the Scriptorium orbit (back half first)
    const orbit = []; for (let j = 0; j <= 96; j++) orbit.push(proj(orbitPt(j / 96 * TAU)));
    const drawOrbit = front => { ctx.beginPath(); let on = false;
      orbit.forEach(p => { if ((p.z > 0) === front) { on ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); on = true; } else on = false; });
      ctx.strokeStyle = rgba(C.gold, front ? 0.42 : 0.16); ctx.lineWidth = dpr; ctx.stroke(); };
    drawOrbit(false);
    const scrollPts = scrolls.map((s, i) => ({ s, p: proj(orbitPt(i / Math.max(1, scrolls.length) * TAU + t * 0.05)) }));
    scrollPts.filter(q => q.p.z <= 0).forEach(q => scrollMark(q.p, 0.45));
    // core: the 64-point lattice; the middle stratum is the people
    const L = LATTICE.map(q => ({ ...q, s: proj(q.p) }));
    for (const [a, b] of LEDGES) line(L[a].s, L[b].s, C.mesh, 0.08, 0.5 * dpr);
    for (const q of L) dot(q.s, (q.w === 3 ? 1.9 : 1.2) * dpr, q.w === 3 ? C.violet : (q.w % 2 ? C.cyan : C.coral), q.w === 3 ? 0.95 : 0.55, q.w === 3);
    // the two sides, held together: keepers ⚔️ and mages 🧙
    for (const [set, col] of [[KEEP, C.coral], [MAGE, C.cyan]]) {
      const P = set.map(proj);
      ctx.beginPath(); [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]].forEach(f => { ctx.moveTo(P[f[0]].x, P[f[0]].y); ctx.lineTo(P[f[1]].x, P[f[1]].y); ctx.lineTo(P[f[2]].x, P[f[2]].y); ctx.closePath(); });
      ctx.fillStyle = rgba(col, 0.035); ctx.fill();
      for (const [a, b] of EDGES) { const back = (P[a].z + P[b].z) / 2 < -0.05; line(P[a], P[b], col, back ? 0.35 : 0.9, (back ? 0.8 : 1.4) * dpr, back ? [3 * dpr, 4 * dpr] : null); }
      P.forEach(p => dot(p, (p.z > 0 ? 3 : 2.2) * dpr, col, 0.95, true));
    }
    // root above, sealing both sides
    const root = proj(ROOT);
    [KEEP, MAGE].forEach(set => { const top = set.map(proj).reduce((a, b) => (b.y < a.y ? b : a)); line(root, top, C.gold, 0.35, 0.9 * dpr, [2 * dpr, 5 * dpr]); });
    ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; const x = root.x + Math.cos(a) * 9 * dpr, y = root.y + Math.sin(a) * 9 * dpr; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.strokeStyle = rgba(C.gold, 0.9); ctx.lineWidth = 1.2 * dpr; ctx.stroke(); dot(root, 3.4 * dpr, C.gold, 1, true);
    label(root, 'one root · the community DID', C.gold, 0.75, -16, 9);
    // the door below, arrivals bringing evidence in
    const door = proj(DOOR), core = proj([0, 0, 0]);
    ctx.strokeStyle = rgba(C.ink, 0.8); ctx.lineWidth = 1.2 * dpr;
    ctx.strokeRect(door.x - 7 * dpr, door.y - 9 * dpr, 14 * dpr, 18 * dpr);
    for (const a of ARRIVALS) {
      const u = (t * 0.12 + a.off) % 1;
      const sx = door.x + a.lane * 60 * dpr, sy = h - 6 * dpr;
      const x = u < 0.55 ? sx + (door.x - sx) * (u / 0.55) : door.x + (core.x - door.x) * ((u - 0.55) / 0.45);
      const y = u < 0.55 ? sy + (door.y - sy) * (u / 0.55) : door.y + (core.y - door.y) * ((u - 0.55) / 0.45);
      dot({ x, y }, 1.6 * dpr, u < 0.55 ? C.gold : C.violet, 0.85 * Math.sin(Math.PI * u), true);
    }
    label(door, 'the door · evidence in', C.ink, 0.6, 24, 9);
    // the Scriptorium front half + scrolls
    drawOrbit(true);
    scrollPts.filter(q => q.p.z > 0).forEach(q => scrollMark(q.p, 0.95));
    const ol = proj(orbitPt(-0.9)); label(ol, 'the Scriptorium', C.gold, 0.7, -10, 9);
    // places
    placeHits = places.map((p, i) => ({ p, s: proj(seat(p, i)) }));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const q of placeHits) {
      const on = hover === q.p;
      if (on) dot(q.s, 13 * dpr, C.ink, 0.12, false);
      ctx.font = `${(on ? 22 : 17) * dpr}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.globalAlpha = q.s.z > -0.2 ? 1 : 0.55; ctx.fillText(q.p.glyph || '✦', q.s.x, q.s.y); ctx.globalAlpha = 1;
      if (on) { ctx.textBaseline = 'alphabetic'; label(q.s, q.p.name, C.ink, 0.95, 24, 11); ctx.textBaseline = 'middle'; }
    }
    ctx.textBaseline = 'alphabetic';
    // legend
    const lg = [['⚔️ keepers · the ground', C.coral], ['⿻ people · the choice', C.violet], ['🧙 mages · the work', C.cyan]];
    ctx.font = `${10 * dpr}px ui-monospace, Menlo, Consolas, monospace`; ctx.textAlign = 'left';
    lg.forEach(([s, col], i) => { ctx.fillStyle = rgba(col, 0.85); ctx.fillText(s, 10 * dpr, h - (14 + (2 - i) * 15) * dpr); });
  }
  let placeHits = [];
  function scrollMark(p, a) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.strokeStyle = rgba(C.gold, a); ctx.fillStyle = 'rgba(8,12,24,.9)'; ctx.lineWidth = dpr;
    ctx.fillRect(-4 * dpr, -5 * dpr, 8 * dpr, 10 * dpr); ctx.strokeRect(-4 * dpr, -5 * dpr, 8 * dpr, 10 * dpr);
    ctx.beginPath(); ctx.moveTo(-2 * dpr, -1.5 * dpr); ctx.lineTo(2 * dpr, -1.5 * dpr); ctx.moveTo(-2 * dpr, 1.5 * dpr); ctx.lineTo(1 * dpr, 1.5 * dpr); ctx.stroke(); ctx.restore();
  }

  // ---------- motion + input ----------
  function tick(now) {
    raf = 0; const dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now;
    if (!drag) { t += dt; if (spinning && !hover) yaw += dt * 0.07; }
    draw(); schedule();
  }
  function schedule() { if (!raf && visible && !document.hidden && !reduce) raf = requestAnimationFrame(tick); }
  function hit(e) {
    const b = canvas.getBoundingClientRect(), x = (e.clientX - b.left) * dpr, y = (e.clientY - b.top) * dpr;
    let best = null, bd = 18 * dpr;
    for (const q of placeHits) { const d = Math.hypot(q.s.x - x, q.s.y - y); if (d < bd) { bd = d; best = q.p; } }
    return best;
  }
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; dragged = false; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 4) dragged = true;
      yaw = drag.yaw + dx * 0.008; pitch = Math.max(-1.1, Math.min(1.1, drag.pitch + dy * 0.006)); if (reduce) draw();
      return;
    }
    const p = hit(e); if (p !== hover) { hover = p; canvas.style.cursor = p ? 'pointer' : 'grab'; opts.onPlaceHover && opts.onPlaceHover(p); if (reduce) draw(); }
  });
  canvas.addEventListener('pointerup', e => { const was = drag; drag = null; if (was && !dragged) { const p = hit(e); if (p && opts.onPlaceClick) opts.onPlaceClick(p); } });
  canvas.addEventListener('pointerleave', () => { if (hover) { hover = null; opts.onPlaceHover && opts.onPlaceHover(null); } });
  new ResizeObserver(() => { resize(); draw(); }).observe(canvas);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; schedule(); }).observe(canvas);
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('pageshow', () => { last = 0; resize(); draw(); schedule(); });
  resize();
  fetch('scrolls.json').then(r => r.json()).then(s => { scrolls = Array.isArray(s) ? s : (s.scrolls || []); draw(); }).catch(() => {});
  draw(); schedule();

  const setSpinning = on => { spinning = !!on && !reduce; };
  return {
    setLayers(next) { places = (next && next.places && next.places.places) || []; draw(); },
    setSpinning,
  };
}
