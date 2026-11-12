# Mages City: state of the site and its subdomains, and a consolidation plan

12 November 2026. Read from the working trees (`~/mages_city`, `~/blake3-mage`, `~/prism_mage`,
`~/caesura`, `~/near_mage`), every `wrangler.jsonc` that routes a `*.mages.city` host, the tunnel
config, and a live probe of every host (status, DNS, title, links back to the apex). Nothing here is
deployed or committed; every step marked **(Mitch)** is his word.

## 1. What is live today

**One apex, 22 Workers, a handful of tunnel doors.**

| layer | hosts | built by | deployed by | live |
|---|---|---|---|---|
| the City (apex) | mages.city, www | `mages_city/site` (prebuilt), `bin/sync-header.mjs` | push to main (Workers Builds) | 200 |
| the quests (12) | sha256, sha3, blake3, poseidon, curve, ecrank, falcon, mldsa, sig, hashsmash (+ hashsmash home) | `blake3-mage/levers` (WSL build) → `deploy_copies.py` | `npx wrangler deploy` per host | 200 all |
| the mages' own scrolls | soul, guide, formal, flashprove, poc, near | `mages_city/bin/*-scroll.mjs` | `npx wrangler deploy` per host | 200 all |
| | **package** | `bin/bundle-scroll.mjs` | **never deployed** | **no DNS** (site links to it ~3,600 times) |
| tools | sigil | `bin/sigil-site.mjs` | wrangler | 200 |
| | **prism** (the Prism) | `prism_mage/viewer/build_prism.py` | staged | **no DNS** (not yet deployed) |
| partner app | caesura | `caesura/site` **and** `near_mage/site` (identical configs, both claim the host) | wrangler | 200 |
| doors (tunnel → the always-on host) | join, dids, vtc (→ join), vta, mediator, trust | `deploy/vti/*`, the Pi | tunnel | 200 |
| the wildcard farm | wiki, portal, exchange, gate, swarm, kappa | `deploy/cloudflared.example.yml` (`*.mages.city`) | tunnel | **no DNS**: the wildcard is not set up |

## 2. How they are shared and directed now

- **The apex menu** (`sync-header.mjs`, synced into 19 pages) is the only map: the journey (Become,
  Guide, Scriptorium, For your city), eight places, the twelve quests, and (as of today) one line to
  the Scriptorium and one to the Prism.
- **Every scroll lists every other** (`scrolls.mjs` writes one line under each scroll's header), so the
  scroll family is cross-linked, but by a long list rather than a home.
- **The apex keeps copies of eight scrolls** (`site/soul/`, `guide-scroll/`, `hashsmash/`,
  `flashprove/`, `package/`, `near/`, `formal/`, `poc/`) beside their subdomains: two addresses for the
  same page, two places to rebuild.
- **The quests link back** to the apex (2 links each); the mages' scrolls link back once; **the doors
  (join, dids, vtc) and trust do not link back at all.**
- **Three build systems** feed the City's hosts (mages_city/bin, blake3-mage levers, prism_mage), each
  with its own deploy step; there is no single list of what should be live.

## 3. What is broken or loose

1. **package.mages.city has no DNS** while the City links to it thousands of times (the research
   package scroll's threads). Deploy it, or point those links at `mages.city/package/`.
2. **The wildcard farm is not live.** wiki, portal, exchange, gate, swarm and kappa resolve nowhere;
   the site names wiki/portal/kappa four times. Mark them parked and drop the links until the host is up.
3. **caesura.mages.city has two owners** (`caesura/site` and `near_mage/site`, identical). Whichever
   deploys last wins. Keep the caesura repo's; delete the other config.
4. **Duplicate scroll copies on the apex** drift from their subdomains between rebuilds.
5. **The doors don't lead home.** A visitor on join/dids/vtc/trust has no way back to the City.
6. **Atlas retired today** (menu); `map.html` stays reachable with a resting note.

## 4. The shape to consolidate towards

One rule: **one canonical address per thing, and every host leads home.**

| what | canonical | how the rest point at it |
|---|---|---|
| the City (people, journey, joining) | **mages.city** | every host carries a "← mages.city" mark |
| the work: every scroll | **scroll.mages.city**, the Scriptorium's own home | `mages.city/scrolls` → 301 here; every scroll's "every other scroll" line becomes one link "❦ the Scriptorium" |
| each scroll | its own subdomain (quests + mages' scrolls) | apex copies (`site/soul/` …) → 301 to the subdomain |
| the trinkets | **prism.mages.city** (the Prism), **sigil.mages.city** (Sigil) | `mages.city/seal.html` → 301 to sigil |
| the star of the chains | mages.city/star.html (the City's sky; it lights the wallet) | linked from the Scriptorium, Star Key, the Prism |
| doors | join, dids, vtc, vta, mediator, trust | unchanged hosts; each gains the home mark |

**scroll.mages.city** (your idea): the Scriptorium as a place of its own, in the scroll pages' own
voice (dark, sealed, nothing but hashes): every quest's scroll and every mage's scroll as rows that
unroll, the star of their roots, and the trinkets shelf with the Prism. The apex keeps a short
Scriptorium door (what it is, why it matters, "enter the Scriptorium →"). Built by the same
`mages_city/bin` tooling as the other scrolls (a `scriptorium.mjs` beside `scrolls.mjs`), so the list
of scrolls has one source: `scrolls.json` + `chains.json`.

## 5. The plan, in order

**Phase 1: fix what is broken (small, safe)**
1. Deploy `package.mages.city` **(Mitch)**, or switch its links to the apex copy.
2. Remove the second caesura config (`near_mage/site/wrangler.jsonc`), keep `caesura/site`.
3. Mark the wildcard farm parked: drop the four live links to wiki/portal/kappa; leave the tunnel
   config as the plan for when the host is up.
4. Home marks: a "← mages.city" link on join/dids/vtc (OpenVTC website templates in `deploy/vti`) and trust.

**Phase 2: the Scriptorium becomes scroll.mages.city**
5. `bin/scriptorium.mjs`: builds `deploy/scroll.mages.city/` from `scrolls.json` + `chains.json` (the
   rows, the trinkets shelf, the star link); leak scan like every scroll.
6. `scrolls.mjs`: the "every other scroll" line becomes one link home to the Scriptorium (plus prev/next).
7. Apex: `arena.html` shortens to the door; `_redirects`: `/scrolls` → `https://scroll.mages.city/` (301).
8. Deploy scroll.mages.city and prism.mages.city **(Mitch)**.

**Phase 3: one source per page**
9. Replace the eight apex scroll copies with 301s to their subdomains (keep the files out of `site/`).
10. `seal.html` → sigil.mages.city (301) once Sigil's page is the same.
11. One manifest, `site/hosts.json`: every host, its builder, its deploy command, its expected status;
    `bin/verify-hosts.mjs` probes them (status, DNS, home mark, scroll leak scan) so this review is a
    command, not an afternoon.

**Phase 4 (optional): fewer Workers**
12. The scroll hosts could share one Worker (one assets bundle, routes per host), but that needs a few
    lines of routing code where the City's rule today is "static assets, no code". Worth it only if 22
    separate deploys become the bottleneck.

## 6. What changed today (local, uncommitted)

The Scriptorium (arena.html) with the Trinkets section and the Prism; `/scrolls` and `/scriptorium`
redirects; menu renamed, eight scroll lines folded into one; Prism links on every scroll page
(template) and on Sigil; the star family cross-linked; preview pages kept off the live site; the
Atlas off the menu. See `~/prism_mage/notes/mages-city-sitemap-review-2026-11-12.md`.

## 7. Done the same evening (local, uncommitted; Mitch chose phases 1 to 3)

**Phase 1.** caesura has one owner: `near_mage/site/wrangler.jsonc` renamed to `wrangler.jsonc.moved-to-caesura`
(identical to `caesura/site`'s, untracked). The parked hosts were only named honestly (a code comment, and
join.html's "hosting is prepared for kappa"), so nothing to remove. join's menu (`community.config.json`) now
reads city · become a mage · the scriptorium · the prism · …; it already led home (the probe missed it because
the menu is drawn by script). Still yours: deploy package.mages.city; dids/vta/mediator/trust have no way home
(vendored apps and the Pi; a home mark there is an upstream or Pi change).

**Phase 2.** `bin/scriptorium.mjs` builds `deploy/scroll.mages.city/` (12 quest scrolls, 8 mages' scrolls, the
star, the trinkets shelf with the shared Prism figure; 18 KB, leak check clean). Every scroll page's head line
(`scrolls.mjs`) is now "❦ the Scriptorium, every scroll · ‹ prev · this · next ›" (soul and guide rebuilt; the
bundle scrolls and quests take it at their next scroll sync). Quests open their mage in the Prism
(`prism.mages.city/#mage=`); the guide's pages carry no Prism link (registry roots, not evidence scrolls).
`/scrolls` → scroll.mages.city is written into `_redirects` as a comment, to switch on after the deploy.

**Phase 3.** The apex's seven scroll copies (soul, guide-scroll, hashsmash, flashprove, near, formal, poc)
redirect (301, with paths) to their own hosts and are no longer uploaded (`.assetsignore`); package keeps its
copy until its host is live. `hosts.json` (repo root, not published) lists all 35 hosts with builder, deploy
and state; `node bin/verify-hosts.mjs` reruns this review: **35 hosts · 32 ok · 3 staged (scroll, prism,
package) · 0 need attention** on 12 Nov.

**Deploy order when you're ready:** prism.mages.city → scroll.mages.city → package.mages.city → switch the
`/scrolls` line in `_redirects` → push mages_city main → the always-on host pulls join's config →
`node bin/verify-hosts.mjs` (scroll/prism/package should flip from staged to live; update hosts.json).
