# parked/

Fronts and surfaces that are ahead of where the City is, kept whole and runnable but not published.
The local twin lays this directory over `site/` (`bin/start.ps1` → `bin/serve-site.js` overlays), so
`http://mages.localhost:3334/<name>/` still works against the local farm. Nothing here ships: `wrangler.jsonc`
uploads `site/` only, and `bin/verify-front.mjs` fails the build if a parked front reappears under `site/`.

- `connected/` — the 2026-09-05 farm front (feed · Portal board · residents · districts). Parked 2026-09-14
  until the farm is public at `wiki.` `portal.` `exchange.` `swarm.mages.city`.
  Notes, inventory and the exact re-entry recipe: `docs/PARKED_2026-09-14_connected-front.md`.
