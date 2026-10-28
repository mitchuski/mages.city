// scrolls.mjs — every scroll in the City, for the list at the head of each scroll page: the soul mage's, the guide's,
// every bundle scroll (site/scrolls.json, written by bin/bundle-scroll.mjs), and each quest's Scroll tab (read from
// site/chains.json, so a new quest joins the list when the index is rebuilt).
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "site");
export function scrolls(here) {
  const list = [{ id: "soul", label: "❦ soul mage", href: "https://soul.mages.city/" }, { id: "guide", label: "❦ guide", href: "https://guide.mages.city/" }];
  try { for (const x of JSON.parse(fs.readFileSync(path.join(SITE, "scrolls.json"), "utf8"))) if (!list.some(s => s.id === x.id)) list.push(x); } catch {}   // scrolls made by bin/bundle-scroll.mjs
  try {
    for (const c of JSON.parse(fs.readFileSync(path.join(SITE, "chains.json"), "utf8")).chains || [])
      list.push({ id: c.id, label: c.name, href: String(c.url).replace(/\/?$/, "/") + "?tab=scroll" });
  } catch {}
  return list.map(s => ({ ...s, here: s.id === here }));
}
export function scrollsLine(here) {
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  return `<nav class="scrolls" aria-label="every scroll">the scrolls: ${scrolls(here).map(s => s.here ? `<b>${esc(s.label)}</b>` : `<a href="${esc(s.href)}">${esc(s.label)}</a>`).join(" · ")}</nav>`;
}
