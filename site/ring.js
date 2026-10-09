// ring.js — the apex as a ring of places on the Star. Reads places.json, seats each place at its
// vertex on the Star figure's lattice (the `places` layer), shows a card on hover, teleports on click.
// The strip of chips beneath is the same nine doors for keyboards and phones. Nothing here is a score.
import { createStarFigure } from "./star-figure.js";

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

(async () => {
  const canvas = document.getElementById("ring"), card = document.getElementById("ring-card"), strip = document.getElementById("ring-strip");
  if (!canvas) return;
  let data;
  try { data = await (await fetch("places.json")).json(); } catch (e) { return; }
  const places = (data.places || []).map(p => ({ ...p, label: p.name }));

  const show = p => {
    if (!card) return;
    if (!p) { card.hidden = true; return; }
    card.hidden = false;
    card.innerHTML = `<span class="ring-glyph">${esc(p.glyph)}</span><b>${esc(p.name)}</b><span class="ring-state ring-state-${esc(p.state)}">${esc(p.state)}</span><p>${esc(p.line)}</p>`;
  };
  const teleport = p => {
    if (!p || !p.door) return;
    if (reduce) { location.href = p.door; return; }
    document.body.classList.add("teleporting");
    setTimeout(() => { location.href = p.door; }, 280);
  };

  const fig = createStarFigure(canvas, {
    spinning: !reduce,
    onPlaceHover: p => { show(p); if (strip) strip.querySelectorAll("[data-place]").forEach(a => a.classList.toggle("is-hover", !!p && a.dataset.place === p.id)); },
    onPlaceClick: teleport,
  });
  const layers = {};
  for (const [id, lvl] of Object.entries(data.ringLayers || { field: 1, core: 0.8 })) layers[id] = { level: lvl };
  layers.places = { level: 1, places };
  fig.setLayers(layers);

  if (strip) {
    strip.innerHTML = places.map(p => `<a class="ring-chip" data-place="${esc(p.id)}" href="${esc(p.door)}" title="${esc(p.line)}"><span>${esc(p.glyph)}</span>${esc(p.name)}</a>`).join("");
    strip.querySelectorAll("[data-place]").forEach(a => {
      const p = places.find(x => x.id === a.dataset.place);
      a.addEventListener("mouseenter", () => show(p)); a.addEventListener("focus", () => show(p));
      a.addEventListener("mouseleave", () => show(null)); a.addEventListener("blur", () => show(null));
      a.addEventListener("click", e => { if (!reduce) { e.preventDefault(); teleport(p); } });
    });
  }
  const btn = document.getElementById("ring-spin");
  if (btn) { let on = !reduce; btn.onclick = () => { on = !on; fig.setSpinning(on); btn.textContent = on ? "pause" : "turn"; }; }
})();
