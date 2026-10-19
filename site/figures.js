// figures.js — the front pages' figures, in the Star's own hand: lattice lines, cyan (the Mage) and coral (the
// Swordsman), soft glow, slow motion. Mount with <canvas data-figure="path|chain|attach">. Pauses off-screen; draws a
// still final frame under prefers-reduced-motion. No dependencies, no network.
(function () {
  var CYAN = "159,214,219", CORAL = "229,164,156", INK = "238,238,242", MUTED = "168,177,195";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rgba = function (c, a) { return "rgba(" + c + "," + a + ")"; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = function (t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); };
  var phase = function (t, a, b) { return ease((t - a) / (b - a)); };

  function glow(g, x, y, r, c, a) {
    var grd = g.createRadialGradient(x, y, 0, x, y, r * 4);
    grd.addColorStop(0, rgba(c, 0.55 * a)); grd.addColorStop(1, rgba(c, 0));
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, r * 4, 0, 6.2832); g.fill();
    g.fillStyle = rgba(c, a); g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
  }
  function line(g, x1, y1, x2, y2, c, a, w, dash) {
    g.save(); g.strokeStyle = rgba(c, a); g.lineWidth = w || 1; if (dash) g.setLineDash(dash);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore();
  }
  function label(g, s, x, y, c, a, size, align) {
    g.fillStyle = rgba(c || MUTED, a == null ? 1 : a); g.font = (size || 12) + "px ui-monospace,Menlo,Consolas,monospace";
    g.textAlign = align || "center"; g.textBaseline = "top"; g.fillText(s, x, y);
  }
  // ── the Star and the City, as solids. Pose: the view the City's figure is built in (star-figure.js), rocked gently
  // around yaw 315° / tilt 62°, the pose farthest (~20°, even while rocking) from every degenerate view of the solid:
  // along a body diagonal it flattens into a hexagram, along a 2-fold axis into two flat triangles.
  var TET_A = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]], TET_B = TET_A.map(function (v) { return [-v[0], -v[1], -v[2]]; });
  var EDGES = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  var PHI = (1 + Math.sqrt(5)) / 2;
  var LATTICE = (function () { // the 64 vertices: {0,1}^6 projected along six golden directions, as in star-figure.js
    var gen = [[0, 1, PHI], [0, 1, -PHI], [1, PHI, 0], [1, -PHI, 0], [PHI, 0, 1], [PHI, 0, -1]].map(function (v) { var l = Math.hypot(v[0], v[1], v[2]); return v.map(function (c) { return c / l; }); });
    var raw = [], max = 0;
    for (var x = 0; x < 64; x++) { var q = [0, 0, 0]; for (var bb = 0; bb < 6; bb++) { var sg = (x >> bb & 1) - 0.5; for (var i = 0; i < 3; i++) q[i] += sg * gen[bb][i]; } raw.push(q); max = Math.max(max, Math.hypot(q[0], q[1], q[2])); }
    return raw.map(function (q) { return q.map(function (c) { return c * 0.8 / max; }); });
  })();
  var SHELL = (function () { // the manifold around it: a rippled sphere, rings of latitude and longitude
    var R = 1.18, eps = 0.07, rings = [], pt = function (ph, th) { var r = R + eps * Math.sin(5 * ph) * Math.cos(6 * th); return [r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)]; };
    for (var i = 1; i < 8; i++) { var ring = []; for (var j = 0; j <= 64; j++) ring.push(pt(i / 8 * Math.PI, j / 64 * 6.2832)); rings.push(ring); }
    for (var k = 0; k < 12; k++) { var r2 = []; for (j = 0; j <= 32; j++) r2.push(pt(j / 32 * Math.PI, k / 12 * 6.2832)); rings.push(r2); }
    return rings;
  })();
  function projector(x, y, scale, rot) {
    var yaw = 5.50 + 0.28 * Math.sin(rot * 0.45), pitch = 1.08 + 0.1 * Math.sin(rot * 0.31 + 1);
    var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return function (v) { var X = v[0] * cy + v[2] * sy, Z = -v[0] * sy + v[2] * cy, Y = v[1] * cp - Z * sp, D = v[1] * sp + Z * cp; var f = 1 / (1 + D * 0.12); return [x + X * scale * f, y + Y * scale * f, D]; };
  }
  function tetrahedra(g, P, r, a) {
    [[TET_A, CORAL], [TET_B, CYAN]].forEach(function (t) {
      var pts = t[0].map(function (v) { return P([v[0] * 0.6 / 1.732, v[1] * 0.6 / 1.732, v[2] * 0.6 / 1.732]); });
      EDGES.forEach(function (e) {
        var p1 = pts[e[0]], p2 = pts[e[1]], depth = (p1[2] + p2[2]) / 2;
        g.strokeStyle = rgba(t[1], (0.6 + 0.35 * (0.5 - depth)) * a); g.lineWidth = 1.3;
        g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.stroke();
      });
      pts.forEach(function (q) { g.fillStyle = rgba(t[1], 0.85 * a); g.beginPath(); g.arc(q[0], q[1], Math.max(1.2, r * 0.035), 0, 6.2832); g.fill(); });
    });
  }
  // a member's Star: the two tetrahedra alone
  function star(g, x, y, r, rot, a) {
    tetrahedra(g, projector(x, y, r * 1.6, rot), r, a);
    glow(g, x, y, Math.max(2, r * 0.08), INK, 0.8 * a);
  }
  // the City: the Star at the core of its manifold, the 64-vertex lattice and its route, inside the shell
  function city(g, x, y, r, rot, a) {
    var P = projector(x, y, r * 0.82, rot);
    SHELL.forEach(function (ring) { g.strokeStyle = rgba(CYAN, 0.1 * a); g.lineWidth = 0.7; g.beginPath(); ring.forEach(function (v, i) { var q = P(v); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke(); });
    var L = LATTICE.map(P);
    for (var i = 0; i < 64; i++) { var p1 = L[i], p2 = L[(i + 1) % 64]; line(g, p1[0], p1[1], p2[0], p2[1], i < 32 ? CORAL : CYAN, 0.16 * a, 0.8); }
    L.map(function (q, i) { return [q, i]; }).sort(function (u, v) { return u[0][2] - v[0][2]; }).forEach(function (o) {
      var q = o[0], c = o[1] < 32 ? CORAL : CYAN; g.fillStyle = rgba(c, (0.35 + 0.45 * (0.5 - q[2] / 1.6)) * a);
      g.beginPath(); g.arc(q[0], q[1], Math.max(0.8, r * 0.018), 0, 6.2832); g.fill();
    });
    tetrahedra(g, P, r * 0.7, a);
    glow(g, x, y, Math.max(2, r * 0.05), INK, 0.85 * a);
  }
  // a faint lattice behind every figure: the 64-vertex field, suggested
  function field(g, w, h, seed, k) {
    k = k == null ? 1 : k;
    var n = 64, s = seed || 7; var rnd = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    var pts = []; for (var i = 0; i < n; i++) pts.push([rnd() * w, rnd() * h]);
    for (i = 0; i < n; i++) for (var j = i + 1; j < n; j++) { var dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1]; if (dx * dx + dy * dy < (w * 0.11) * (w * 0.11)) line(g, pts[i][0], pts[i][1], pts[j][0], pts[j][1], CYAN, 0.05 * k); }
    for (i = 0; i < n; i++) { g.fillStyle = rgba(i % 3 ? CYAN : CORAL, 0.18 * k); g.beginPath(); g.arc(pts[i][0], pts[i][1], 1.2, 0, 6.2832); g.fill(); }
  }

  // ── path: your agent → a door → a keeper admits → the credential comes home to your agent
  function path(g, w, h, t) {
    field(g, w, h, 11, 0.7);
    var y = h * 0.5, xs = [w * 0.14, w * 0.43, w * 0.72, w * 0.9], T = t % 9 / 9;
    var names = ["your agent", "a door", "a keeper", "the City"], cols = [CYAN, INK, CORAL, CYAN];
    line(g, xs[0], y, xs[2], y, MUTED, 0.25, 1);
    line(g, xs[2], y, xs[3], y, MUTED, 0.18, 1, [3, 4]);
    // the return arc: the credential travels home over the top
    g.save(); g.strokeStyle = rgba(CYAN, 0.22); g.setLineDash([2, 5]); g.beginPath(); g.moveTo(xs[2], y - 6); g.quadraticCurveTo((xs[0] + xs[2]) / 2, y - h * 0.42, xs[0], y - 6); g.stroke(); g.restore();
    // nodes
    star(g, xs[0], y, h * 0.13, t * 0.6, 1);
    g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.3; var d = h * 0.08; g.beginPath(); g.moveTo(xs[1], y - d); g.lineTo(xs[1] + d, y); g.lineTo(xs[1], y + d); g.lineTo(xs[1] - d, y); g.closePath(); g.stroke();
    glow(g, xs[2], y, h * 0.035, CORAL, 0.9);
    city(g, xs[3], y, h * 0.2, t * 0.4, 0.9);
    for (var i = 0; i < 4; i++) label(g, names[i], xs[i], y + h * 0.17, cols[i], 0.85, Math.max(10, h * 0.045));
    // the request: agent → door → keeper
    var p1 = phase(T, 0.05, 0.42), px = lerp(xs[0], xs[2], p1);
    if (T > 0.05 && T < 0.46) glow(g, px, y, h * 0.02, CYAN, 0.95);
    if (T > 0.44 && T < 0.56) { var k = phase(T, 0.44, 0.56); glow(g, xs[2], y, h * (0.035 + 0.05 * Math.sin(k * 3.14)), CORAL, 0.6); label(g, "admits", xs[2], y - h * 0.2, CORAL, Math.sin(k * 3.14), Math.max(10, h * 0.045)); }
    // the credential: keeper → home, along the arc
    var p2 = phase(T, 0.56, 0.92);
    if (T > 0.56 && T < 0.95) { var u = p2, cx = (xs[0] + xs[2]) / 2, cy = y - h * 0.42, ax = xs[2], ay = y - 6, bx = xs[0], by = y - 6;
      var qx = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx, qy = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by;
      glow(g, qx, qy, h * 0.022, INK, 0.95); }
    if (T > 0.9) { var z = phase(T, 0.9, 1); glow(g, xs[0], y, h * 0.03 * (1 + z), CYAN, 0.5 * (1 - z)); label(g, "held by you", xs[0], y - h * 0.24, CYAN, 1 - z, Math.max(10, h * 0.045)); }
  }

  // ── chain: leaves (failures in coral) sealed pairwise up to one root anyone can recompute
  function chain(g, w, h, t) {
    field(g, w, h, 5, 0.35); t += 2.5;
    var n = 8, levels = [], T = t % 10 / 10, fail = { 2: 1, 5: 1 };
    var top = h * 0.16, bottom = h * 0.78, span = w * 0.72, x0 = (w - span) / 2;
    for (var L = 0, m = n; m >= 1; L++, m = m / 2) {
      var row = []; for (var i = 0; i < m; i++) row.push([x0 + span * (i + 0.5) / m, lerp(bottom, top, L / 3)]); levels.push(row);
    }
    // edges, lit as the seal climbs
    for (L = 0; L < 3; L++) for (i = 0; i < levels[L].length; i++) {
      var a = levels[L][i], b = levels[L + 1][i >> 1], lit = phase(T, 0.12 + L * 0.2, 0.3 + L * 0.2);
      line(g, a[0], a[1], b[0], b[1], MUTED, 0.32, 1);
      if (lit > 0) line(g, a[0], a[1], lerp(a[0], b[0], lit), lerp(a[1], b[1], lit), CYAN, 0.75, 1.4);
    }
    // leaves appear one by one
    for (i = 0; i < n; i++) {
      var on = phase(T, 0.01 * i, 0.01 * i + 0.08), p = levels[0][i], s = h * 0.035;
      g.fillStyle = rgba(fail[i] ? CORAL : CYAN, 0.35 + 0.5 * on); g.strokeStyle = rgba(fail[i] ? CORAL : CYAN, 0.5 + 0.5 * on);
      g.fillRect(p[0] - s / 2, p[1] - s / 2, s, s); g.strokeRect(p[0] - s / 2, p[1] - s / 2, s, s);
    }
    for (L = 1; L < 3; L++) for (i = 0; i < levels[L].length; i++) glow(g, levels[L][i][0], levels[L][i][1], h * 0.012, CYAN, phase(T, 0.28 + (L - 1) * 0.2, 0.36 + (L - 1) * 0.2) * 0.9);
    var r = levels[3][0], rp = phase(T, 0.68, 0.8);
    glow(g, r[0], r[1], h * 0.03 * (0.6 + 0.6 * rp), INK, 0.3 + 0.7 * rp);
    var fs = Math.max(10, h * 0.042);
    label(g, "root  sha256:8c1c1c0d…", r[0], r[1] - h * 0.11, INK, rp, fs);
    label(g, "candidates · checks · failed attempts", w / 2, bottom + h * 0.07, MUTED, 0.9, fs);
    if (T > 0.82) { var c = phase(T, 0.82, 0.9) * (1 - phase(T, 0.96, 1)); label(g, "✓ anyone can recompute it", r[0], r[1] + h * 0.05, CYAN, c, fs); }
  }

  // ── attach: the City's Star, and communities founded on its stack joining through trust edges
  function attach(g, w, h, t) {
    field(g, w, h, 23, 0.55); t += 7.2;
    var cx = w / 2, cy = h * 0.5, R = Math.min(w, h) * 0.41, T = t % 12 / 12, k = 5, fs = Math.max(10, h * 0.042);
    city(g, cx, cy, h * 0.3, t * 0.4, 1);
    label(g, "Mages City", cx, cy + h * 0.31, CYAN, 0.9, fs);
    for (var i = 0; i < k; i++) {
      var ang = -1.5708 + i * 6.2832 / k + t * 0.02, x = cx + R * 1.7 * Math.cos(ang), y = cy + R * 0.88 * Math.sin(ang);
      var at = (i - 3) * 0.22 + 0.08, born = i < 3 ? 1 : phase(T, at, at + 0.12) * (1 - phase(T, 0.92, 1)), tie = i < 3 ? 1 : phase(T, at + 0.08, at + 0.2) * (1 - phase(T, 0.92, 1));
      if (born <= 0) { glow(g, x, y, 1.5, MUTED, 0.4); continue; }
      if (tie > 0) { line(g, x, y, lerp(x, cx, tie), lerp(y, cy, tie), CYAN, 0.45, 1, [4, 4]); }
      star(g, x, y, h * 0.07 * born, t * 0.5 + i * 1.7, 0.8 * born);
      if (i === k - 1) {
        label(g, "your community", x, y + h * 0.1, INK, born, fs);
        // its mage: a small Star in orbit, arriving once the community is tied to the City
        var mg = phase(T, at + 0.16, at + 0.26) * (1 - phase(T, 0.92, 1));
        if (mg > 0) { var oa = t * 0.9, ox = x + h * 0.13 * Math.cos(oa), oy = y + h * 0.07 * Math.sin(oa);
          g.save(); g.strokeStyle = rgba(CYAN, 0.18 * mg); g.setLineDash([2, 4]); g.beginPath(); g.ellipse(x, y, h * 0.13, h * 0.07, 0, 0, 6.2832); g.stroke(); g.restore();
          star(g, ox, oy, h * 0.03, t * 1.2, mg); label(g, "its mage", x, y - h * 0.15, CYAN, mg, fs); }
      }
    }
    // members recognised across: a pulse along a random tie
    var j = Math.floor(t / 2) % k, a2 = -1.5708 + j * 6.2832 / k + t * 0.02, pu = (t % 2) / 2;
    if (j < 3) glow(g, lerp(cx + R * 1.7 * Math.cos(a2), cx, pu), lerp(cy + R * 0.88 * Math.sin(a2), cy, pu), h * 0.012, INK, 0.9 * Math.sin(pu * 3.14));
  }

  // ── guide: your agent's Star and the City, four journeys between them; each dot a step, walked in turn
  var JOURNEYS = [["C", "join", 5], ["B", "show your work", 7], ["D", "attach", 5], ["A", "stand one up", 7]];
  function guide(g, w, h, t) {
    field(g, w, h, 31, 0.5);
    var ax = w * 0.1, bx = w * 0.86, y = h * 0.5, fs = Math.max(10, h * 0.042), per = 4.5, cur = Math.floor(t / per) % 4, u = (t % per) / per;
    star(g, ax, y, h * 0.12, t * 0.6, 1); label(g, "your agent", ax, y + h * 0.17, CYAN, 0.85, fs);
    city(g, bx, y, h * 0.24, t * 0.4, 0.95); label(g, "the City", bx, y + h * 0.3, CYAN, 0.85, fs);
    var offs = [-0.34, -0.12, 0.12, 0.34];
    JOURNEYS.forEach(function (J, k) {
      var cy = y + h * offs[k] * 1.25, on = k === cur, x0 = ax + h * 0.1, x1 = bx - h * 0.22;
      var Q = function (s) { return [(1 - s) * (1 - s) * x0 + 2 * (1 - s) * s * ((x0 + x1) / 2) + s * s * x1, (1 - s) * (1 - s) * y + 2 * (1 - s) * s * cy + s * s * y]; };
      g.save(); g.strokeStyle = rgba(on ? CYAN : MUTED, on ? 0.55 : 0.16); g.lineWidth = on ? 1.4 : 1; if (!on) g.setLineDash([3, 5]);
      g.beginPath(); for (var i = 0; i <= 40; i++) { var q = Q(i / 40); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); g.restore();
      for (var n = 1; n <= J[2]; n++) {
        var sp = n / (J[2] + 1), q2 = Q(sp), lit = on && ease((u - sp * 0.85) * 8) > 0;
        if (lit) glow(g, q2[0], q2[1], h * 0.012, n % 2 ? CYAN : CORAL, 0.95);
        else { g.fillStyle = rgba(MUTED, on ? 0.5 : 0.28); g.beginPath(); g.arc(q2[0], q2[1], h * 0.009, 0, 6.2832); g.fill(); }
      }
      var top = Q(0.5);
      label(g, J[0] + " · " + J[1], top[0], top[1] + (offs[k] < 0 ? -h * 0.075 : h * 0.03), on ? INK : MUTED, on ? 0.95 : 0.55, fs);
      if (on) { var pq = Q(Math.min(1, u * 1.05)); glow(g, pq[0], pq[1], h * 0.016, INK, 0.9 * (1 - phase(u, 0.92, 1))); }
    });
  }

  var FIG = { path: path, chain: chain, attach: attach, guide: guide };
  function mount(cv) {
    var draw = FIG[cv.dataset.figure]; if (!draw) return;
    var g = cv.getContext("2d"), visible = true, t0 = performance.now(), raf = 0;
    function size() { var r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); g.setTransform(d, 0, 0, d, 0, 0); return r; }
    var box = size();
    function frame(now) {
      g.clearRect(0, 0, box.width, box.height);
      draw(g, box.width, box.height, reduce ? 8.6 : (now - t0) / 1000);
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } }).observe(cv);
    window.addEventListener("resize", function () { box = size(); if (reduce) frame(performance.now()); });
    raf = requestAnimationFrame(frame);
  }
  document.querySelectorAll("canvas[data-figure]").forEach(mount);
})();
