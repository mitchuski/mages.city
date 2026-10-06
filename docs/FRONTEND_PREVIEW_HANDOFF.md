# City homepage promotion

> **2026-09-14 addendum.** `/connected/` is no longer published: the connected front moved to `parked/connected/` (twin-only, overlaid by `bin/start.ps1`), `site/_redirects` sends `/connected/*` to `/`, and `bin/verify-front.mjs` fails the build if it reappears. Post-deploy checks are now `/`, `/map`, `/join` and `/connected/` → 302. Inventory + re-entry: `docs/PARKED_2026-09-14_connected-front.md`. `/preview/` is still published and unreferenced; its removal awaits a separate ruling.

The redesigned City Spellbook / Spellspace now lives at site/index.html (the public root). The previous farm-connected front is preserved intact under site/connected/ with its own styles, data module and configuration. Root navigation and Connect link to it. Existing /preview/ links remain valid during transition.

The page builder never generated index.html; it generates skill.md and orientation.md only. npm run build now checks the expected redesigned root with bin/verify-front.mjs. npm run deploy runs the same check before Wrangler. Full npm run verify is still the separate farm integration suite.

Push these reviewed paths together: site/, bin/verify-front.mjs, package.json, docs/FRONTEND_PREVIEW_HANDOFF.md. The redesign is now the root landing, but its mock cast, graph and VTA/economy panels still do not provide service integration. /connected/ retains the existing functional entry. No backend code or DNS was changed. No push was performed.

Labs board links were updated to the City root. Labs shield restoration is a separate pending Labs commit. Verify Cloudflare uses this repository and npm run build before its deploy step. After deployment check /, /map, /join, /connected/ and /connected/board.
