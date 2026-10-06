# mages.city site map review — 2026-09-14

Question: is `/connected/` an old version, a double-up, or a pending VTA-farm integration?
Method: live crawl of mages.city from `/` (same-host links; table below), live-vs-HEAD diff of every page,
DNS + HTTP probes of every `*.mages.city` host the site references, and the repo history of `site/`.
Live = HEAD `11a8e9a` on every page (the only byte differences on `/connected/*` are CRLF endings).

## Verdict

1. **`/connected/` is the 2026-09-05 front, demoted on purpose.** Commit `327ff42` (09-07) made the City
   Spellbook atlas the index and moved the old "farm-connected" front (feed · Portal board · residents · wiki
   door) to `site/connected/`. Both fronts are published deliberately: `bin/verify-front.mjs` requires
   `connected/index.html`, `bin/verify.mjs` §5 checks both paths, and `docs/FRONTEND_PREVIEW_HANDOFF.md`
   says "/connected/ retains the existing functional entry". The older style (Cormorant/DM Sans, coral–cyan
   wave, Google Fonts) is that front's own `style.css` — it is the Sep-5 agentprivacy-styled front, unchanged.
2. **In production it is a shell: it is the local twin's front without its body.** `connected/config.js`
   resolves by hostname to `wiki.` `portal.` `swarm.` `exchange.mages.city`. None of those names has a DNS
   record (probed today: no answer, HTTP 000). So on the live page the roster fetch fails ("the wiki did not
   answer"), residents render empty, the feed stays empty, and the board preview reports "the Portal desk
   did not answer". Only the hero, the three cards and the footer render. The farm runs on the keeper's host
   / tailnet (twin at `mages.localhost:3334`, Pi at `:3341`) and is not tunnelled to `*.mages.city` yet
   (deploy/ describes the Cloudflare Tunnel wildcard; it has not been stood up). The launch reader (09-14)
   already flagged this as "△ roster unreachable".
3. **It is not the pending VTA-farm integration.** The VTA farm is a separate lane: `vta.` `mediator.` `dids.`
   `vtc.mages.city` are CNAMEs to `lb.firstperson.dev`, which is still NXDOMAIN at its own nameservers
   (re-checked today), so those four hosts are placed but dead. The provider console
   `vtafarm.firstperson.dev` answers 200 and is what the root index's "VTA Farm ↗" link opens. The connected
   front's own card still says "The farm is not open yet", which remains true. What `/connected/` is waiting
   on is the **wiki farm tunnel** (Hall/Portal/Exchange/Swarm), not the VTA farm.

## Double-ups found (real ones)

| What | Where | Evidence | Note |
|---|---|---|---|
| Third copy of the atlas front | `site/preview/` (5.7 MB: 3.3 MB PNG + 2 MB vendored three.js) | 0 inbound links in the crawl; no external site links it (agentprivacy.org/.ai, skills., soulbis link only `/`, `/skill.md`, `/city-*`) | `327ff42` said "left in place rather than deleted". Pure dead weight. |
| Old-front scripts at the root | `site/config.js` `data.js` `record.js` `404.html` | byte-identical to the connected copies; no root page loads them | **not leftovers — load-bearing:** `verify.mjs` §5 serves them and §6 imports `site/data.js` + `record.js`. Keep. |
| Two agent-entry kits | `/skill.md` + `/orientation.md` (kit-built, 12 KB, City Key arrival, capability status) vs `/connected/skill.md` + `/connected/orientation.md` (4 KB) | `bin/build-pages.js --kit` writes only to `site/`; the `connected/` pair is hand-patched (f5588ec) and drifts | the `/connected/` hero button "Read skill.md" sends an agent to the stale kit; `llms.txt` names `/skill.md` canonical |
| Two boards | `/board` (root Contribute, static) vs `/connected/board` (Portal Room, desk-wired, dead in prod) | crawl | by design, but the second one cannot work until the desk is tunnelled |

## Site-map hygiene

- No `sitemap.xml`, no `robots.txt` (both 404). `llms.txt` is live but unlinked (fine; convention file).
- Inbound to `/connected/`: the index notice, `/join` ("The connected community"), and `/connected/board`.
- Uncommitted locally: `site/skill.md` (+28 lines), `site/llms.txt` (agent door → agentprivacy.ai), `docs/RUNBOOK.md`.

## Ruling 2026-09-14: B applied

The connected front is parked at `parked/connected/` (twin overlay), `/connected/*` → `/` (302), links dropped from the index and join pages, both gates updated. Inventory + re-entry: `docs/PARKED_2026-09-14_connected-front.md`. `/preview/` untouched pending a ruling.

## Options as they stood before the ruling

- **A (recommended, small):** keep `/connected/` as the twin's front but make it honest: a one-line banner
  ("the community front; the farm is not public yet"), point its skill.md button at `/skill.md`, delete
  `site/preview/` and the four root leftovers, then re-run `npm run verify:front`.
- **B:** unpublish `/connected/` until the tunnel is up (edit index/join links, `verify-front.mjs` required
  list, and `verify.mjs` §5 rows together, or the build gate fails).
- **C:** stand up the Cloudflare Tunnel wildcard per `deploy/` so `wiki.`/`portal.`/`exchange.`/`swarm.`
  resolve — then `/connected/` works as designed and the double-up question disappears.

## Live crawl (same-host URLs, crawler noise removed)

```
URL                                        STATUS TYPE                   SIZE  in:INBOUND
/                                          200   text/html             41288  in:10
/arrival.css?v=4                           200   text/css               4669  in:1
/arrival.js?v=3                            200   text/javascript        2779  in:1
/atlas-perspective.js                      200   text/javascript        6318  in:1
/atlas.css                                 200   text/css               5435  in:1
/atlas.js                                  200   text/javascript       11345  in:1
/board                                     200   text/html              2774  in:1
/board-preview.js                          200   text/javascript         304  in:1
/board.html                                307   → /board                0  in:6
/city-atlas-v1.png                         200   image/png           3160990  in:1
/city-constellation-v1.svg                 200   image/svg+xml         41669  in:2
/city-key-arrival.md                       200   text/markdown          5794  in:5
/city-mage.json                            200   application/json       2945  in:3
/city-mage.md                              200   text/markdown          4841  in:3
/city-topology.json                        200   application/json      35363  in:1
/connected/                                200   text/html             15529  in:3
/connected/board                           200   text/html              8029  in:1
/connected/config.js                       200   text/javascript        1222  in:2
/connected/orientation.md                  200   text/markdown          3505  in:1
/connected/skill.md                        200   text/markdown          4324  in:2
/connected/style.css                       200   text/css               8515  in:2
/discover                                  200   text/html              3632  in:1
/discover.html                             307   → /discover             0  in:1
/economy-context.json                      200   application/json        508  in:1
/experience-overview.json                  200   application/json       3453  in:1
/favicon.svg                               200   image/svg+xml           266  in:10
/join                                      200   text/html              7250  in:1
/join.html                                 307   → /join                 0  in:8
/kappa-space.json                          200   application/json        566  in:1
/manifold.svg                              200   image/svg+xml        127617  in:1
/map                                       200   text/html              7461  in:1
/map-static                                200   text/html              4220  in:1
/map-static.html                           307   → /map-static           0  in:1
/map.html                                  307   → /map                  0  in:7
/mcp-entry.md                              200   text/markdown          3063  in:1
/orientation.md                            200   text/markdown          3909  in:2
/participation.md                          200   text/markdown          1811  in:1
/proverb-roots.json                        200   application/json        114  in:1
/proverb-roots.schema.json                 200   application/json       5037  in:1
/reading/the-key-that-held-a-place.md      200   text/markdown         11443  in:5
/skill.md                                  200   text/markdown         10446  in:4
/space                                     200   text/html              5223  in:1
/space.html                                307   → /space                0  in:3
/spellbook-references.json                 200   application/json      52622  in:1
/spellbooks                                200   text/html             24917  in:1
/spellbooks.html                           307   → /spellbooks           0  in:1
/star-arrival.css?v=shared-popup-2         200   text/css               4032  in:1
/star-arrival.mjs?v=shared-popup-2         200   text/javascript        2453  in:1
/star-experiment/                          200   text/html              2402  in:2
/star-experiment/practice-city-key.json    200   application/json        231  in:1
/star-experiment/reading/assets/star-BDrudRfC.js 200   text/javascript      195637  in:1
/star-experiment/reading/assets/star-uQ1BgEtm.css 200   text/css               3109  in:1
/star-experiment/reading/star              200   text/html               355  in:1
/star-experiment/reading/star.html         307   → /star-experiment/reading/star        0  in:1
/style.css                                 200   text/css               4538  in:8
```
