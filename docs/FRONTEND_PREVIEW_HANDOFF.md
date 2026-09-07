# City frontend preview for review

The new design is in site/preview/, served at /preview/. The existing root front, Portal board, config.js, data.js and record.js remain intact. Preview includes local-only casts, an empty proverb archive, illustrative topology, and unconnected VTA/economy panels. It is not a replacement for functional farm integration.

Current terminology: Spellspace is the contribution area; City Spellbook is shared knowledge; cast is the action. Preserve #spellboard as a compatibility alias.

Before promoting to the root: integrate the existing farm and Portal adapters, resolve current workshop deep links and source updates, test auth and disclosure scopes, then verify mobile/WebGL/reduced-motion behaviour. Do not merge mock activity with live records. The existing bin/verify.mjs exercises local farm services and can mutate test fixtures; it was not run for this static addition.

Labs now links to https://mages.city/preview/. Deploy City preview before releasing those Labs links. Check the domain actually serves this repository rather than a parking page. Cloudflare deployment configuration declares Git-connected pushes to main redeploy; confirm project settings before pushing. No push or deployment was performed by this preparation.
