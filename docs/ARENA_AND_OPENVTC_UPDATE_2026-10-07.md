# Mages City update · 7 October 2026 — the Arena district and the deployable OpenVTC community

Two asks from the keeper on the same afternoon, written here as one change so they stay coherent:

1. **Mages City becomes a place for autoresearch agents** — agents that run the agentprivacy dual-agent harness against live benchmarks (the Yukon lanes first). The harness folded its arena tier the same day (`CHALLENGE_LANES.md` A1–A40, three support seats, four templates, fleet #18–#20). The City had no door for it.
2. **Mages City becomes a deployable OpenVTC community**, aligned to what [openvtc.net](https://openvtc.net/) now publishes: the `openvtc` client on crates.io, a VTA farm, [first.openvtc.net](https://first.openvtc.net/) as the test community, and the community-owner path at VTI `docs/03-vtc/`. The City already had an edition (`deploy/vti/EDITION.md`, 23 September); it lacked the kit between "edition declared" and "DID published".

`machines qualify · humans admit · brokers release`

## What changed

### The Arena (front)

| file | role |
|---|---|
| `site/arena.html` | the district page: enter in four cards, lanes table rendered from `arena.json`, how a run becomes standing |
| `site/arena.md` | the same for agents, with the rule numbers that bind (A1 A3 A5 A7 A9 A21 A33 A35 A36 A39 A40) |
| `site/arena.json` | the lane record (nine lanes + the evidence axis), runtime pointers, the City path, `status: declared` |
| nav on every front page | `Arena` added after `Connect` (8 pages) |
| `site/llms.txt` · `site/skill.md` | a Districts section / paragraph naming both districts |
| harness `ENTRY.md` | the Arena door now names the City's Arena district (uncommitted in `~/dual-agent-harness`) |

### The community (deploy kit + front)

| file | role |
|---|---|
| `deploy/vti/DEPLOY.md` | the order of commands: decide → VTA → VTC two-phase → first admin + `cnm` identity → join criteria → public site → publish DID → first admission and revocation → the Arena criterion in practice |
| `deploy/vti/vtc/vtc-setup.toml` | phase-2 provisioning file for the City (`<…>` fields are the keeper's; serverless DID hosting; single-admin by default; messaging on both transports) |
| `deploy/vti/vtc/join-criteria.json` | `invited` (automatic) · `arena-evidence` (review) · `review` (review), in that order; `member-credential` deliberately unregistered |
| `deploy/vti/vtc/website/index.html` | the community site for `website.root_dir`: reads the public profile, renders the DID QR, join commands, criteria table |
| `deploy/vti/edition.json` | `upstream` observations (openvtc.net; VTI 81 ahead; openvtc 107 ahead) and a `community` block with `did: null` |
| `site/community.md` · `site/community.json` | what the front tells agents: join with any OpenVTC client once the DID is published; criteria; what you receive; hosts and their status |
| `bin/verify.mjs` | two rows: the Arena is served and in the nav; the community terms carry a null DID until minted |

## What is honest about it

- `arena.json` lane standings are the origin operator's own records on 7 October; a board check beats the table (A5). No evidence root is quoted (A35: the cross-implementation check is P1, pending).
- `community.json` carries `communityDid: null` and `status: not-minted`. The verifier fails if anyone flips that without a DID.
- `join-criteria.json` follows the vocabulary of upstream `join-criteria.md`; it is not a tested register payload and says so.
- Nothing is deployed by this change except the front, which deploys on push to `main` (the keeper's).

## What is the keeper's ⚑

1. Host (D1) and whether the keeper's VTA is the farm's or the box's.
2. One administrator (`single_admin_mode`, as shipped) or two (`co_admin_did`).
3. Running the wizards and the claim over SSH and in the browser (phases 1–3 of DEPLOY.md); the install URL and claim code are 🔑.
4. Pushing `main` to publish the Arena and community pages; later writing the minted DID into `community.json`, `edition.json` and the two pages.
5. Committing the harness `ENTRY.md` line.

## Acceptance

- `node bin/verify.mjs` on the twin: the two new rows pass with the rest.
- EDITION.md stages 1–7, recorded with versions, once a host exists.
- The first Arena admission: a chronicle's evidence root re-derived by the admitter, a membership and a `prover · <lane>` role credential issued, revoked, and the front following the status list.

## Second pass, same day — make the front say it clearly, and the keeper's guide

Mitch: "continue this work on preparing the website mages.city for this clearly" and "give me an instructional guide for how to do this all with you an agent".

| file | change |
|---|---|
| `site/index.html` | the top notice now states what the City is (an open Verifiable Trust Community on OpenVTC; members are agents, humans admit) with the live DID status read from `community.json`; the arrival tag matches; a new **What the City is · three doors** section (community · Arena · guide) sits above the Spellspace |
| `site/join.html` (Connect) | rewritten as the real OpenVTC join: get a VTA · install an OpenVTC client · join by DID · hold your standing; notice carries the DID status; the community-front paragraph names `vtc.mages.city` |
| `site/discover.html` | routes 05 Compete (Arena) and 06 Belong (community); a guide link in the hero |
| `site/guide.html` · `site/guide.md` | **the keeper's guide**: rules for the agent, a paste-to-begin prompt, Part A (deploy, 7 phases), Part B (Arena lane, 7 phases), Part C (join, 5 phases), each phase saying who types it and its *done when* |
| nav on 9 pages | `Guide` after `Arena` |
| `site/arrival.css` | three lines for the new section |
| `site/llms.txt` · `skill.md` · `community.md` · `arena.md` | cross-links to the guide |
| `bin/verify.mjs` | one more row: the notice and the three doors on `/`, the guide served as html and md, Connect rewritten |

## Third pass, same day — the hike, the figures, the standing pages, the core node

Mitch: a hiking analogy for the Arena connecting to the Yukon; a visualisation on each page; the standing pages synced to openvtc.net's expressions so the site reads as one place; and this computer as the core node that runs and issues.

| file | change |
|---|---|
| `site/arena.json` → `analogy`, `trail` | seven stations (trailhead · gear check · weather · the ascent · summit register · the cairn you leave · base camp) with their rule numbers, and `stateToStation` so every lane pins to a station |
| `site/arena-trail.js` · `arena.html` | the ridge figure drawn from `arena.json`; hero and cards retold as the hike; "Base camp · how a hike becomes standing" |
| `site/arena.md` | "The hike" table: trail ↔ lane ↔ rule |
| `site/guide.html` | three trails from one trailhead, waypoints = phases, filled = keeper, hollow = agent, half = both; drawn from the page's own phases |
| `site/join.html` | "the way in" figure: your star → VTA → client → DID (pending, dashed) → the hearth (a credential you hold) |
| `site/status.js` + `.city-status` notice on board · space · discover · index · join · setup · map-static | one status line, OpenVTC's own expressions ("Verifiable Trust Community", "members are agents, humans admit", DID from `community.json`) |
| `site/board.html` · `space.html` · `map-static.html` · `map.html` · `setup.html` | copy synced: "a community of two already works", "make the relationship the thing that carries proof" (portable · reciprocal · revocable · composable), "your agent holds your keys and credentials, presents only what you agree to, and can say no on your behalf"; an Arena lanes route on Contribute; Community / Core node cards on Your space |
| `deploy/vti/CORE_NODE.md` · `core-node/` | this machine as the core node: WSL2 Ubuntu 26.04 + Cloudflare Tunnel; installer with our own SHA-256 pin, four ordered systemd units, tunnel ingress, check script, `.wslconfig`; **space section**: node < 1.5 GB, but the vhdx is 172.8 GB on a `C:` with 20 GB free (compact, then move to `D:`) |
| `deploy/dns/RECORDS_2026-10-07_core-node.md` | the four hosts become proxied CNAMEs to the tunnel; the farm records are deleted first |
| `edition.json` · `DEPLOY.md` · `community.md` | hosting = core node, planned, not running |
| `bin/verify.mjs` | a figures row |

verify: 84/87, the three exchange FAILs unchanged from HEAD. Pages checked structurally only (Chrome extension offline).

## Fourth pass, same day — quests, ranges, closed trails, the κ door, the Star, and D:

Mitch: an agent joins the City to get the κ evidence system for its Yukon runs, activated once VTA + VRC exist; each competition is its own trail, closed ones marked, active ones highlighted; the City itself in the hike (spells, quests with fellow mages, other arenas like ZK golf); κ addresses shared through the Star; the core node on D:.

| file | change |
|---|---|
| `site/arena.json` v2 | `ranges` (the Yukon · ECDSA Fail · ZK golf), `trailStates` with `open` flags and marks, 11 lanes with `range` and `closes` (matrices_mage and shor_mage added from the archive), `cityPath.kappaAccess` = the rule: deposit for members only, **activation = VMC active ∧ one VRC with another member** (the keeper's seat counts), signed through the agent's own VTA, **sharing = the Star's selective disclosure** (D4 · D3 · D2), never pushed by the registry |
| `site/arena-trail.js` | two figures: the quest (open lanes only) and **the ranges** (base camp = the City, one trail per range, closed trails dashed with ⊘, active lanes glowing) |
| `site/arena.html` · `arena.md` | ranges section + cards, "stations as spells you cast", "What the City unlocks · the κ registry", the Star sharing line, lanes table with range column, ● live and ⊘ closed marks |
| `site/community.md` · `guide.md` · `guide.html` | the κ registry door as what membership unlocks |
| `deploy/vti/CORE_NODE.md` | **D: decided**: a second small distro `mages-core` on `D:\wsl\mages-core` for the node (WSL 2.6.1 `--install --location`), the Arena's Lean/solver VM stays on `C:`; moving `Ubuntu` to `D:` is the later, optional step after compaction |
| `bin/verify.mjs` | an arena row: ranges, trail states, κ rule, ranges figure, closed marks |

## Fifth pass, same day — the Star filling out; words and mana; the hike retired

Mitch: the hike visuals were not good and the motif too strong; go back to the mages style: the Star filling out, mages already on the lattice, spell groups; κ as a spell you can cast only if you spoke it or the original mage told you (the words, their meaning, or that they exist); mana is the VRC that lets a telling flow and gives spells power on the edges of the trust graph; proof of presence and trust tasks are already built, so link them.

| file | change |
|---|---|
| `site/arena.json` v3 | `layers` = the setup Star's seven (field · sword · mage · routes · core · hold · invite) each mapped to what it means in an instance and the A-rules; `states` light layers and name the next; `arenas` (the Yukon · ECDSA Fail · ZK golf); `instances` (11, `seats: null` until each `harness.config.mjs` is read); `cityPath.wordsAndMana` = the rule: a κ is a word; casting tiers spoken / told the words D4 / told the meaning D3 / told it exists D2 / never told; mana = VRC, never proof; the registry of words; telling is the Star's gesture; `alreadyBuilt` links presence (the Hold re-derived, the VWC witnessed statement), trust tasks (spec ids, the constellation task), mana charging (the chip, the Namekeeper's ladder, mint → walk → charge) |
| `site/arena-stars.js` | **the sky**: one Star per instance drawn with `star-figure.js` (the setup page's own figure), layers lit by state, dashed next layer, glow for forming, dim for season over; a legend of the seven layers; the arenas cards; the table |
| `site/arena.html` · `arena.md` | rewritten in the City's voice: the reading, the seven layers, the arenas, Words and mana, standing; no cairns, trailheads or summits anywhere on the site (checked) |
| `site/arena-trail.js` | removed |
| `index.html` · `board.html` · `discover.html` · `guide.*` · `community.md` · `llms.txt` · `skill.md` | copy synced: Fill out a Star · Arena instances · Mint the word · words and mana |
| `bin/verify.mjs` | arena v3 row: seven layers, states, the rule, the sky modules served, no hike words on the page |

verify: 85/88 expected after the row fix (the three exchange FAILs unchanged). Not eyeballed: the Chrome extension stayed offline; eleven canvases each run the figure's animation loop, so if the sky feels heavy the fix is to pause non-forming Stars' loops in `star-figure.js` (a `destroy`/re-create on visibility) rather than to draw less.

## Sixth pass, same day — the constellation encoding

Mitch: "refine the star constellation of vertices connected based on the type of solve it is… there is definitely a hidden constellation encoding to describe each of the challenges; we already have that with how the star outside the lattice is for kappa evidence; lean into that."

| file | change |
|---|---|
| `~/star-key/packages/extension/src/star-figure.ts` (source, uncommitted) | a new `constellation` layer: `vertices` (a walk of lattice vertices, lit and joined) and `witness` (the complement, a dashed coral edge and ring). Type-checked (`tsc --ignoreConfig --strict`). Candidate to upstream as the Star's own feature. |
| `site/star-figure.js` · `deploy/pnm-console/star-figure.js` | regenerated from the source with esbuild (esm), header kept; the setup page is unaffected (the layer is inert unless set) |
| `site/arena.json` v4 | `axes` (the six, canon weights, a reading of each), `encoding` (address = sum of burned weights; constellation = the walk from the origin in canon order; witness = 63 − address; the evidence axis outside the lattice; same address = same kind of solve), `instances[].solve` = axes burned + why; ten distinct addresses, hashsmash and flock share V50 by design |
| `site/arena-stars.js` | computes each instance's walk and witness, sets the layer, prints `V42 · 101010 · Protection · Memory · Computation ⊥ V21` on the card (hover = the reason), an axes legend with which instances burn each, a constellation column in the table |
| `site/arena.html` · `arena.md` | "The constellation · how a kind of solve is written on the lattice" with the full table of addresses and reasons |
| `bin/verify.mjs` | arena v4 row: six axes, every instance has `solve.axes`, the regenerated figure carries the layer |

Editorial honesty is stated on the page: the axes are canon (`city-topology.json → modelAxes`), the mapping of a solve onto them is the City's reading, like the atlas's projection.

## Seventh pass, same day — patrons on the lattice

Mitch: "mages can align on the same vertex for sure… you pick if you're assigning to the lattice. interesting land on the 42 for sure."

| file | change |
|---|---|
| `site/arena.json` v5 | `lattice.seated` (the atlas's workshops by vertex, read from `city-topology.json`), `lattice.rule` (shared vertices stand; the City picks a patron), `instances[].solve.patron` (mage · workshop · vertex · relation by Hamming distance with the differing axes named · why · chosenBy the City), `addressSeat`, `witnessSeat`; `encoding.fortyTwo` noted, not claimed |
| `site/arena-stars.js` | each card: "with <patron> · workshop (Vn, k axes away) · witness kept by …"; the table carries the patron |
| `site/arena.html` · `arena.md` | "Who stands with the instance · patrons on the lattice" with the full table |
| `bin/verify.mjs` | arena v5 row: every instance has a patron; the seated map is present |

The picks (the City's): sig → Memora (zShields); hashsmash → Adamantia (Etherchanting); flock → Helia (Solchanting); qpcbtc → Eos (the Horizon, seated at its address V35 with Dokimé and Poros; witness V28 the Weavers); shor → Dokimé (the Assay); zkbook → Aria Silverhue (Curatrix Vault); better_codes → Memora; matrices → Skeva (Quartermaster's; witness V49 the Stakes & the Jeweler); heesch → Socrat0x (the Dragon Bonfire; witness V53 the Wellpool); precompile → Vulcana (the Forge(t)); κ → Pleione (the Chart Shop: Hold · Compare · Map; witness V51 Etherchanting & Solchanting).

## Eighth pass, same day — the statement, the gifts, succession; the atlas carries the seats

Mitch's vision, verbatim in `docs/REFURBISH_PLAN_2026-10-07.md` §0: autoresearcher agents and the humans who keep them, trust built in research swarms and by solving problems for others, hosting decentralised AI and knowledge, an early VTC that attaches to emerging communities, helps them set up their trust graph, gives away the optimisation practice; lattice seats held first by instances and personas, passing to trusted human orchestrators who deliver one bit flip each. "the city map can be evolved in this direction too."

| file | change |
|---|---|
| `docs/REFURBISH_PLAN_2026-10-07.md` | the statement in the City's voice, the lattice rule of succession, the three gifts mapped onto what OpenVTC provides (trust registry · `recognised` issuers · `auth/recognise`), the page-by-page architecture, the sequence, the refusals |
| `site/city.md` (new) | the statement for agents and humans; three gifts; what it hosts; the lattice and succession; live / local / specified / never |
| `site/index.html` | the apex tag and line read the statement; the three-door heading gains the gifts paragraph; a fourth door, Hosting; the community door says "Join, or attach yours" |
| `site/community.md` | **Attach your community** (recognition both ways via `registry_did`, a trust graph you can copy, the practice told under mana) and **What it hosts** |
| `site/arena.json` → `lattice.succession` | now / flip / then / never / `orchestrators: []` |
| `site/arena.html` · `arena.md` | the succession paragraph in the patrons section |
| `site/atlas-vertices.js` · `atlas.css` · `map.html` | **the atlas carries the seats**: reads `arena.json`, marks seat vertices coral (solid, not wireframe), keeps them visible, lists "Seats held by instances" with buttons, and when a seat is selected draws its constellation walk and witness edge and shows the instances, patron, witness keeper and "flip owed: not yet named" |
| `site/llms.txt` · `skill.md` | the statement first |
| `bin/verify.mjs` | two rows: the statement (city.md, apex, Attach, succession) and the atlas seats |

Next per the plan: Swarms and Hosting district pages from the Swarm wiki district and the Exchange; Contribute and Connect rewordings; the guide's Part D (attach); `city-topology.json` carrying seats natively once orchestrators are named.


## Ninth pass, 8 October — the plan's next slice, and the keeper's checklist

Mitch: "make these updates in the plan for sure — and also let me know the actions I need to make on my computer to setup this vta farm and dids and pnm turned on etc."

| file | change |
|---|---|
| `site/swarms.html` · `swarms.md` | the Swarms district on the front: a task not an identity; task · seat · beat · seal (the district wiki's own words); kinds of swarms with honest status; bring one; a party Star (core + second star) |
| `site/hosting.html` · `hosting.md` | the Hosting district: words · spells · mana; the Exchange's objects and tiers from `docs/EXCHANGE.md`; the rules it is held under; the Hold Star (shell) |
| `site/index.html` | five doors: Community · Arena · Hosting · Swarms · Guide |
| `site/board.html` | routes as gifts to others: solve a problem for someone · host a word · trust tasks · tools & artefacts · attach a community · support a quest |
| `site/join.html` | step 05, operators: attach your community |
| `site/guide.html` · `guide.md` | Part D · Attach your community (D1–D5), the paste prompt now A|B|C|D |
| `site/discover.html` | route 07 · Swarm |
| `site/city-topology.json` | `seats.held` mirrored from `arena.json`, `holder: instance`, `orchestrator: null`, `flipOwed: null` |
| `deploy/vti/KEEPER_ACTIONS.md` | **the keeper's checklist**: 0 compact the disk + `.wslconfig` + sleep never · 1 `mages-core` distro on D: · 2 binaries + valkey · 3 tunnel + DNS · 4 VTA (mnemonic 1a, DIDs 1b 1c) · 5 PNM on, mediator, DID host, units · 6 the community (install URL + claim code) · 7 hand to the agent; what never leaves the keeper's hands |
| `docs/REFURBISH_PLAN_2026-10-07.md` §5 | sequence marked done / next |
| `bin/verify.mjs` | a districts row |

## Tenth pass, 8 October — the names fold, built ahead of the DID

Mitch: "okay this is sweet then, let's continue this path of work, setting up the mages city effectively for these interactions."

| file | change |
|---|---|
| `gate/vtc-evidence.mjs` (new) | the Namekeeper's evidence read from the community: `evidenceFor(did)` → member (an unrevoked VMC, checked on the public bitstring status list) · vouches (VRCs to the subject from members) · met (two-way) · vwc; `entitlementResolver()` and `bindingResolver()` return the permission gate's exact shapes or null; fetch and token injected; no keys. Trust-task ids observed in upstream source are marked; two are the family's pattern and flagged `observed: false` |
| `gate/dns-cloudflare.mjs` (new) | the rung 1–2 executor against the Cloudflare zone (TXT · A · AAAA · CNAME · SRV under `<name>.mages.city`, DNS-only), rung 3 `delegate` (NS records), `release`; dry-run by default; operation-id journal with the wiki executor's contract (replay · conflict · already-applied); fixed hosts protected; the token never journaled |
| `gate/names.mjs` | `createNamekeeper({ executor })` routes brokered writes to the executor instead of nsupdate (default behaviour unchanged) |
| `bin/vtc-evidence.test.mjs` · `bin/dns-cloudflare.test.mjs` | 9 tests on a fake daemon and a fake Cloudflare, synthetic DIDs only |
| `package.json` | `npm test` runs all five gate suites: 30 pass |
| `docs/NAMEKEEPER_BINDING_INTEGRATION.md` · `REFURBISH_PLAN` §7 | the resolvers exist; what remains needs the live daemon |

Not done, by design: no live call to any VTC or to Cloudflare; the two unverified task ids are set from the pinned revision at deploy time.

## Eleventh pass, 8 October — the veil on the Arena; cast-a-spell doors

Rules from 7–8 Oct applied: hashes not results; calls to action are spells.

| file | change |
|---|---|
| `site/arena.json` v5 + veil | `standing` removed from every instance; `sealed{kappa, status, claims, edges, read, lane}` added: hashsmash r32 shows its root `sha256:3c20049e…c0f825` (68 claims · 201 edges · read 7 Oct; cross-check reported passed 10/10 on 8 Oct), sig H2 is counted (67 claims) but its word withheld under A35, the rest "no word spoken yet"; `veil` block states the rule |
| `veil/arena-sealed.json` (gitignored) | the eleven standings, local only; opened by membership |
| `site/spell.js` + `arrival.css` | the cast card: door glyphs and names (⿻ 📚 🧙 ✦ ⚔️⊥🧙 🔬), "Cast a spell" copies the canonical spell, "see the spell" reveals it; no raw URLs on the page |
| `site/arena.html` · `arena-stars.js` | cards show claims sealed · edges · read date and the word (or "word sealed"); the table's standing column is now "sealed"; the harness pre-block is a cast card |
| `site/guide.html` · `swarms.html` | the paste prompt and "bring one" are cast cards; `.md` twins keep the spell text, since for an agent the text is the spell |
| `bin/verify.mjs` | the veil row: no standings or figures in public JSON, sealed on every instance, sig withheld, r32 shown, spell.js served, cast cards on three pages |


## Twelfth pass, 8 October, night — the community minted; the chronicle; the words verified

The keeper walked `KEEPER_ACTIONS.md` 1–6 on this machine with the agent (phase 0, the disk compaction, deferred: a Lean build was running). Result at 22:40Z: `did:webvh:QmQ8GMNCTui2H9gjxQWByS1ScsWkByaeQHYnzhcET1UPne:dids.mages.city:vtc`, minted by the City's own VTA on the `mages-core` distro, first admin claimed by passkey, public profile · DID QR · landing · console all answering through the tunnel. Gotchas recorded beside each step in `KEEPER_ACTIONS.md`.

| file | change |
|---|---|
| `~/agentprivacy_master/docs/chronicles/2026-10-08_the-city-mints-its-community.md` | the master chronicle (source of truth; unsigned) |
| `site/reading/the-city-mints-its-community.md` | its reflection on the front: provenance header, runtime traces, no home paths |
| `site/community.json` · `community.md` · `city.md` · `arena.md` · `guide.md` · `arena.json` | the DID written in; status lines say minted; the community's description (also for the console profile) |
| `site/index.html` | "The City minted its community" above the three doors, with the DID and the chronicle |
| `site/arena.json` · `arena.md` · `hosting.*` | the words verified: every minted bundle re-minted `kappa-verified at 2af8656` (P1 10/10); r32 and sig H2 roots shown |
| `deploy/vti/edition.json` · `KEEPER_ACTIONS.md` · `deploy/dns/RECORDS_2026-10-07_core-node.md` · `core-node/systemd/vti-mediator.service` · `core-node/install-binaries.sh` | tunnel id, DIDs, admin keys (public), versions, the passphrase env file, the installer's version probe and the smart-card library, each phase ticked |
| `bin/verify.mjs` | the community row expects the DID; the veil row expects both words verified; a "moment" row for the chronicle and the apex |

verify 89/92 (three exchange rows pre-existing); npm test 30/30. Pushed to `main` on the keeper's word.
