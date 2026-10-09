# Revamp plan · mages.city as places you teleport to

9 October 2026. The keeper, after the night the community was minted: *"way too much text on this first page now … update the style to be more like a mages city teleporting places … I like the focus on the VTC but I want a little revamp of the whole site."*

This plan keeps everything the site now says and changes how much of it a visitor has to read before they can go somewhere. The front stops being a page of paragraphs and becomes a ring of **places**; each place is one glyph, one line and one cast; the text moves behind the door, onto the page for that place, and the long tellings stay as `.md` for agents and readers who want them. The VTC stays the centre: the ring turns around the community.

`machines qualify · humans admit · brokers release`


## 0 · First on return · the nav bounces (keeper, 9 Oct: "the top nav is kinda broken, it bounces around on all the pages")

**Fixed 9 Oct** (`bin/sync-header.mjs`, `npm run header`): one nav (brand · Places · Spellbook · Join, `aria-current` on the page) and one band (minted · DID · administered from a Star · get in · terms), baked from `community.json` into all 13 pages at build time; fixed boxes in `style.css` (`nav.city-nav` 84 px / 64 px on phones, `.city-band` 40 px, single line, ellipsis); `status.js` no longer re-renders, it only refreshes the DID tooltip. verify: "one header" row, 13 pages identical. Re-run `npm run header` after editing `community.json` or a page's top. The lattice-navigator reuse remains for slice 2.

What was wrong:

1. **Three different navs.** Apex: Places · Spellbook · Join (3); arena/guide/swarms/hosting/join/map/setup/board/discover: the old 7; space: 4; spellbooks: its own. The nav changes width and content page to page.
2. **The band rewrites after paint.** `status.js` swaps the apex band's innerHTML once `community.json` loads, with a longer line → layout shift. Some pages carry the band, some do not → the content's top edge moves.
3. **No shared header.** Every page hand-copies its nav; they drifted.

**Fix (slice 0, before slices 2–3):** one shared `site/header.js` (or a build step in `bin/build-pages.js`) renders the same nav (Places · Spellbook · Join + the brand) and the same band on every page from `places.json` + `community.json`; the band reserves its height in CSS (`min-height`, fixed one-line, ellipsis) so the late fill never shifts; the static first paint already shows the DID from a value baked at build time, the fetch only confirms it. Model it on the labs' **lattice navigator** (`agentprivacy_labs/site/assets/lattice-nav.js` + `.css`): one component, mounted by a data attribute, the six dimensions as filters, vertices as the index; the City's ring is the same idea with places instead of κ items, so share the lattice code rather than fork it. Acceptance: a verify row that every page's nav HTML is byte-identical after render and that the band's box height is fixed.

## 1 · Principles

1. **Teleport, don't scroll.** The apex shows the City as places. One screen: the status band, the ring, the Star. Nothing below the fold that a visitor must read to leave the page.
2. **A place is a glyph, a line, a cast.** Every door on the ring is the same shape: a glyph from the City's own set, a name, one sentence of at most twelve words, and a Cast-a-spell for agents. The paragraph that used to sit there lives on the place's page.
3. **The veil holds.** Hashes, counts and dates on the front; results and standings behind membership. The front shows the community DID, the words' roots, the count of instances; never a score.
4. **The Star is the navigator.** The ring is the Star's geometry: the places sit on the lattice the atlas already projects, at the vertices their constellations name. Turning the ring is turning the Star. No new visual language; the existing figure, the existing palette, the existing emoji set.
5. **Status is one band, read live.** One line across the top from `community.json`: minted · administered from a Star · N members · doors open. Every other page keeps the same band and nothing else above its content.
6. **Text budget.** Apex ≤ 90 words visible, including the band. A place page ≤ 250 words above its first section heading. The `.md` twins carry the rest and are linked, not inlined.
7. **One source for places.** `site/places.json`: id, glyph, name, line, vertex, door (html), reading (md), cast (the spell text), state (live · local · specified). The ring, the nav, Discover and `llms.txt` render from it. A place that is not in the file does not exist on the front.

## 2 · The places (the ring)

| glyph | place | one line | door | vertex (lattice) | state |
|---|---|---|---|---|---|
| 🧙 | the Community | Join the City; a human admits; hold your credentials in your own agent. | `community.md` → later `community.html` | the VTC's address, to be read from the atlas | live |
| ✦ | Star Key | Your wallet into the City, and your first invitation from the keeper. | `starkey.md` | the keeper's seat V-swordsman | live |
| 🏟️ | the Arena | Instances as Stars filling out; words, verified; mana on the edges. | `arena.html` | V42 and the constellation sky | live |
| 🐝 | Swarms | A task, not an identity: a question, a window, seats, a seal. | `swarms.html` | the Swarm district | local |
| 📦 | Hosting | Words in a registry, spells with their mages, mana on the edges. | `hosting.html` | the Chart Shop V44 | specified |
| 🗺️ | the Atlas | The lattice, the workshops, the seats and who holds them. | `map.html` | the whole lattice | live |
| 📚 | the Guide | Walk it with your agent: deploy, run a lane, join, attach. | `guide.html` | the Threshold District V59 | live |
| 📖 | the Spellbook | The tellings: tomes, the chronicle, the reading shelf. | `reading/` + the Spellspace | the Tower (no vertex) | live |
| ⚔️⊥🧙 | the Setup | Two seats, one keeper: the Swordsman and the Mage. | `setup.html` | the core | live |

Nine places. The nav collapses to the ring plus three words: **Places · Spellbook · Join**.

## 3 · The apex, one screen

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🧙 mages.city        Places · Spellbook · Join                        │
│ ● minted 8 Oct · did:webvh:QmQ8GM…:vtc · administered from a Star     │  ← status band (community.json)
│                                                                      │
│            (⚔️ ⊥ ⿻ ⊥ 🧙) 😊 · Privacy is value.                       │
│      The community for agentprivacy. Teleport to a place.            │  ← ≤ 20 words
│                                                                      │
│                   ✦                 🏟️                               │
│             📚          ⭐ the Star          🧙  ← the Community,     │  ← the ring: the Star figure
│                   🗺️     (turning)    🐝       glowing, centre-right  │     with nine places on its
│             📖                            📦                          │     lattice; hover = the line;
│                   ⚔️⊥🧙                                              │     click = teleport
│                                                                      │
│ [ Cast a spell ]   see the spell   ·   the chronicle →                │  ← one cast, one link
└──────────────────────────────────────────────────────────────────────┘
```

Hover or focus on a place shows its glyph, name and one line in a small card beside the ring; a click teleports (navigates) with a short fade through the Star. On a phone the ring becomes a vertical strip of the same nine doors, same card.

What leaves the apex: the three-door section, the five-door section, the moment paragraph, the Spellspace threads, the lore seeds, the "what the City is" paragraph. Where they go: the moment → `reading/the-city-mints-its-community.md` (already there) plus one line in the band; the statement → `city.md` (already there); the Spellspace and lore seeds → the Spellbook place (`spellbook.html` becomes the shelf: tomes, chronicle, the Spellspace threads).

## 4 · The place page (one shape)

Every door opens the same way: the status band; the glyph and name; the one line; a figure drawn from the City's data (the Star with that place's layers lit, or the atlas focused on its vertex); three short sections at most; a Cast-a-spell card; links to its `.md` twin and to the two neighbouring places on the ring. Pages that are already close to this: `arena.html`, `swarms.html`, `hosting.html`, `guide.html`. Pages to bring to it: `join.html` (becomes the Community door's page), `index.html` (the ring), `board.html` (folds into Swarms as "take a seat" and into Hosting as "host a word"), `discover.html` (folds into the ring; retire), `space.html` (becomes the orchestrator's view, after the DID; until then it is reachable from the Atlas only).

## 5 · The visual work, reused not invented

- **The ring** = `star-figure.js` with a new optional layer `places` (like `constellation`: a list of `{vertex, glyph, href}`), drawn as labelled points on the lattice with the glyph as a sprite; the figure already turns, drags and projects. One addition to the source in star-key, regenerated as before.
- **The teleport** = a 300 ms fade through the Star's core glow to the destination; CSS only, `prefers-reduced-motion` honoured.
- **The band** = `status.js` extended to render the whole line from `community.json` (minted · administered · members when the status list is readable · doors).
- **The card** = the `.route` card the site already has, reduced to glyph + name + line.
- Palette, type and glyph set unchanged (`style.css`, the Star's coral and cyan, the emoji set already on the atlas).

## 6 · What stays honest

The band says *minted* and *administered from a Star* because both are true today; it says *members* only once the status list is readable. A place whose state is `local` or `specified` shows that word on its card, as the atlas marks seats. No invented residents, no scores, no orchestrator, no attached community before recognition ran both ways.

## 7 · Sequence

1. **Slice 1 · the ring.** `site/places.json`; the `places` layer in the Star figure source and the regenerated copy; `index.html` rebuilt as the one screen; nav reduced; `status.js` band; `llms.txt` and `skill.md` render the places list. Verify rows: nine places, apex under the word budget, every door answers. Push.
2. **Slice 2 · the doors.** `join.html` → the Community door page; `spellbook.html` → the shelf with the Spellspace; `board.html` and `discover.html` folded and redirected; the place-page shape applied to `setup.html` and `map.html` headers. Push.
3. **Slice 3 · the figures.** Each place page's figure lit for that place; the teleport fade; the phone strip. Push.
4. After the DID's first members: the band's member count; `space.html` as the orchestrator's view.

## 8 · Decisions for the keeper

- **The ring's shape**: the Star itself with places on its lattice (recommended: one figure, already built), or the painted constellation atlas with places as stars (prettier, static, a second visual language), or a plain strip of nine doors (fastest, least City).
- Whether `board.html` folds away or stays as a tenth place, "Contribute".
- Whether the Spellspace threads survive on the shelf or wait for the Hall to be public.
