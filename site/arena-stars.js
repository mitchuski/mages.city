// arena-stars.js — the Arena as a sky of Stars filling out. One Star per autoresearch instance,
// drawn with the same figure the two-seat setup draws (star-figure.js: field · sword · mage · routes ·
// core · hold · invite), its layers lit by the instance's state in arena.json. Nothing here computes a
// score: the state is the operator's record, the layers are its reading.
import { createStarFigure } from "./star-figure.js";

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ALL = ["field", "sword", "mage", "routes", "core", "hold", "invite", "constellation"];
const ORDER = ["Protection", "Delegation", "Memory", "Connection", "Computation", "Value"];

// a solve's constellation: walk from the origin adding its burned axes in canon order; witness = 63 - address
function constellationOf(solve, axes) {
  const weight = Object.fromEntries((axes || []).map(a => [a.name, a.weight]));
  const burned = ORDER.filter(n => (solve?.axes || []).includes(n));
  const walk = [0]; let v = 0;
  for (const n of burned) { v += weight[n] || 0; walk.push(v); }
  return { walk, address: v, witness: 63 - v, bits: v.toString(2).padStart(6, "0"), burned };
}

function layersFor(state, con) {
  const out = {};
  for (const id of ALL) out[id] = { level: 0, next: false };
  for (const [id, lvl] of Object.entries(state.layers || {})) out[id] = { level: lvl, next: false };
  for (const id of state.next || []) if (out[id] && out[id].level === 0) out[id] = { level: 0.9, next: true };
  if (con && con.walk.length > 1) out.constellation = { level: state.open === false ? 0.45 : 1, next: false, vertices: con.walk, witness: con.witness };
  return out;
}

(async () => {
  const sky = document.getElementById("ar-sky");
  if (!sky) return;
  let a;
  try { a = await (await fetch("arena.json")).json(); } catch (e) { return; }
  const states = a.states || {}, arenas = a.arenas || [];
  const arenaName = id => (arenas.find(x => x.id === id) || {}).name || "the evidence axis";
  const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const order = ["active", "submitted", "hold", "axis", "watching", "paused", "parked", "blocked", "closed", "unknown"];
  const list = [...(a.instances || [])].sort((x, y) => order.indexOf(x.state) - order.indexOf(y.state));
  sky.innerHTML = "";
  const figures = [];
  for (const inst of list) {
    const st = states[inst.state] || states.unknown || { label: inst.state, layers: {}, next: [] };
    const card = document.createElement("article");
    card.className = "ar-star" + (st.open === false ? " ar-star-closed" : "") + (inst.state === "active" ? " ar-star-live" : "");
    const con = constellationOf(inst.solve, a.axes);
    const lit = ALL.filter(id => id !== "constellation" && (st.layers || {})[id] > 0).length, nxt = (st.next || [])[0];
    card.innerHTML = `<canvas width="240" height="240" aria-label="${esc(inst.id)} — ${esc(st.label)}"></canvas>`
      + `<h3><code>${esc(inst.id.replace(/_mage$/, ""))}</code>${inst.state === "active" ? ' <span class="ar-live" title="forming now">●</span>' : ""}${st.open === false ? ' <span class="ar-shut" title="season over">⊘</span>' : ""}</h3>`
      + `<p class="ar-star-arena">${esc(arenaName(inst.arena))}${inst.window ? " · " + esc(inst.window) : ""}</p>`
      + `<p class="ar-star-state">${esc(st.label)} · ${lit}/7 layers${nxt ? " · next: " + esc((a.layers.find(l => l.id === nxt) || {}).label || nxt) : ""}</p>`
      + `<p class="ar-star-bench">${esc(inst.benchmark)}</p>`
      + `<p class="ar-star-sealed">${inst.sealed?.claims ? `${inst.sealed.claims} claims sealed · ${inst.sealed.edges} edges · read ${esc(inst.sealed.read)}` : "no word spoken yet"}</p>`
      + (inst.sealed?.kappa ? `<p class="ar-star-kappa" title="${esc(inst.sealed.status)}"><code>${esc(inst.sealed.kappa)}</code></p>` : inst.sealed?.claims ? `<p class="ar-star-kappa ar-star-withheld" title="${esc(inst.sealed.status)}">word sealed · ${esc(inst.sealed.status)}</p>` : "")
      + `<p class="ar-star-con" title="${esc(inst.solve?.why || "")}">V${con.address} · ${con.bits} · ${esc(con.burned.join(" · ")) || "—"} <span class="ar-wit">⊥ V${con.witness}</span>${inst.solve?.outsideLattice ? " · outside the lattice" : ""}</p>`
      + `<p class="ar-star-patron">${inst.solve?.patron ? `with <b>${esc(inst.solve.patron.mage)}</b> · ${esc(inst.solve.patron.workshop)} <span title="${esc(inst.solve.patron.why)}">(V${inst.solve.patron.vertex}, ${esc(inst.solve.patron.relation)})</span>` : ""}${(inst.solve?.witnessSeat || []).length ? ` · witness kept by ${esc(inst.solve.witnessSeat.map(x => x.keeper).join(" & "))}` : ""}</p>`
      + `<p class="ar-star-seats">${inst.seats ? esc(inst.seats.join(" · ")) : "party: seats not yet read from the instance"}</p>`;
    sky.appendChild(card);
    const fig = createStarFigure(card.querySelector("canvas"), { spinning: !reduce && !!st.spin });
    fig.setLayers(layersFor(st, con));
    figures.push(fig);
  }
  // one figure per state in the legend
  const legend = document.getElementById("ar-legend");
  if (legend) {
    legend.innerHTML = "";
    for (const l of a.layers || []) {
      const li = document.createElement("li");
      li.innerHTML = `<b>${esc(l.label)}</b> <span>${esc(l.draws)}</span> — ${esc(l.means)} <code>${esc(l.rules)}</code>`;
      legend.appendChild(li);
    }
  }
  const axes = document.getElementById("ar-axes");
  if (axes) {
    axes.innerHTML = "";
    for (const ax of a.axes || []) {
      const li = document.createElement("li");
      const who = (a.instances || []).filter(i => (i.solve?.axes || []).includes(ax.name)).map(i => i.id.replace(/_mage$/, ""));
      li.innerHTML = `<b>${esc(ax.name)}</b> <code>${esc(ax.bit)} · ${ax.weight}</code> — ${esc(ax.reads)}<span class="ar-axis-who">${who.length ? who.join(" · ") : "no instance yet"}</span>`;
      axes.appendChild(li);
    }
  }
  const status = document.getElementById("ar-status");
  if (status) status.textContent = `Status: ${a.status} · updated ${a.updated} · ${a.statusNote}`;
  // the table, for reading without the sky
  const tb = document.getElementById("ar-table");
  if (tb) {
    tb.innerHTML = "";
    for (const inst of list) {
      const st = states[inst.state] || {};
      const tr = document.createElement("tr"); if (st.open === false) tr.className = "ar-closed";
      const c = constellationOf(inst.solve, a.axes);
      tr.innerHTML = `<td><code>${esc(inst.id)}</code></td><td>${esc(arenaName(inst.arena))}</td><td><code>V${c.address}</code> ${esc(c.burned.join(" · "))}<br><span class="ar-patron-cell">${inst.solve?.patron ? "with " + esc(inst.solve.patron.mage) + " · " + esc(inst.solve.patron.workshop) : ""}</span></td><td>${esc(inst.benchmark)}</td><td>${esc(st.label || inst.state)}${inst.window ? " · " + esc(inst.window) : ""}</td><td>${inst.sealed?.claims ? `${inst.sealed.claims} claims · read ${esc(inst.sealed.read)}` : "—"}${inst.sealed?.kappa ? `<br><code class="ar-kappa-cell">${esc(inst.sealed.kappa.slice(0, 23))}…</code>` : inst.sealed?.claims ? "<br><span class=\"ar-star-withheld\">word sealed</span>" : ""}</td>`;
      tb.appendChild(tr);
    }
  }
  const cards = document.getElementById("ar-arenas");
  if (cards) {
    cards.innerHTML = "";
    for (const ar of arenas) {
      const ins = (a.instances || []).filter(i => i.arena === ar.id), open = ins.filter(i => (states[i.state] || {}).open !== false).length;
      const d = document.createElement("div"); d.className = "ar-card";
      d.innerHTML = `<h3>${esc(ar.name)}${open ? "" : ' <span class="ar-shut">⊘</span>'}</h3><p>${esc(ar.kind)}. ${ins.length} instance${ins.length === 1 ? "" : "s"}, ${open} open. ${esc(ar.note)}</p>`;
      cards.appendChild(d);
    }
  }
  const btn = document.getElementById("ar-spin");
  if (btn) { let on = !reduce; btn.onclick = () => { on = !on; figures.forEach((f, i) => f.setSpinning(on && !!(states[list[i].state] || {}).spin)); btn.textContent = on ? "pause the sky" : "turn the sky"; }; }
})();
