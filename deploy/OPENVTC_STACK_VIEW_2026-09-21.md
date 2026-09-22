# The OpenVTC stack for agentprivacy — the deployment view, 21 September 2026

*One page that says what the stack is for, what is live, what is blocked, and the order. The Star is the core artefact: the product the stack exists to carry. `deploy/` is the deployment truth (D11); this page reads the runbook, the farm ruling and the 13 Sept self-host proposal and adds what was measured today. Every "live" below is a probe run on 21 Sept, not a belief.*

`machines qualify · humans admit · brokers release`

## 0 · The picture

```
 PRODUCT   the Star — geometry + City Key + Hold + signatures     soulbis /star · /signatures · /sigil · /skye · agentprivacy.ai/city
   │       surfaces: web rooms · extension · (PWA) · CLI           star-key (fork of the OpenVTC wallet) · agentprivacy-mcp bin/star.mjs
   ▼
 RUNTIME   the Swordsman signs; the Hold holds; verifiers verify  agentprivacy-mcp (hold_verify · conformance pack, PUSHED) · runtimes/star-hold 55/55
   │
   ▼
 COMMUNITY Mages City — a VTC whose members are agents           the front (LIVE) · Hall wiki + Portal + Exchange (built, no host on the internet)
   │       gate = policy for when to issue a VIC                  the chip verifies κ · did:key · signed record (built) · the gate service (not built)
   ▼
 INFRA     VTA · mediator · DID host · VTC                        hosted farm (claimed; LB name dark) ‖ self-host explore box (proposal; box not created)
           agents' own VTAs                                        vtafarm.firstperson.dev (UP) — Track 0
```

Three layers are ours and already built. The fourth is the decision this page exists to make crisp.

## 1 · The Star, as the product

| surface | what it is | live today | state |
|---|---|---|---|
| `soulbis.com/star` | the manifold; signatures panel (11 schemes as byte volumes, 24 KiB budget, fold, circuit) | **200** | deployed from commit `764e853`; the local working tree adds an uncommitted V7 fiber panel (commit + deploy = Mitch) |
| `soulbis.com/signatures` | the same panel as a lab view | 200 | — |
| `soulbis.com/star-experiment/` | the extension's reading pane as a web preview (`build:star-preview`) | 200 | built 8 Sept |
| `agentprivacy.ai/city` | the City Key producer (κ, packets root, export) | **200** | — |
| `~/star` (public `mitchuski/star`, the standalone holospace) | the five rooms | n/a | **SYNCED TODAY** to the soulbis working tree byte-for-byte: `star/ lattice/ sigil/ skye/ guide/` + `public/sitenav.js` + `public/rooms.css` + `star/signature-{math,focus}.js` + `signatures/` + `star-experiment/`; no dangling root-relative link; **uncommitted** |
| star-key extension | the OpenVTC wallet with the Star pane, the Hold verifier (`star-hold.ts`, not yet wired into the pane) | unpublished | upstream merge **measured clean** in a scratch worktree (build, 6/6, tsc); real merge waits on the other window's uncommitted files |
| `agentprivacy-mcp` `bin/star.mjs` | `relate · hold show/verify/project · present (NOT AVAILABLE, says why) · profiles` | n/a | pushed; `fixtures/star-hold-conformance/` tracked, 9 files |
| labs `agentprivacy.org/fund/projects/star-key` | "One Star for identity, knowledge and community" · need profile 111100 · V60 | 200 | — |
| PWA | upstream `packages/pwa` shell (no manifest, no service worker) | — | not started; route A in the nexus review §5.2 |

What the product needs from the stack, in order, to hold its first real item: a VTA that can receive a credential → a community that issues one → the item in the Hold → the City chip reading the root. Nothing in that chain needs a server of ours until the second step.

## 2 · The stack, component by component

| component | upstream | ours | measured 21 Sept | next |
|---|---|---|---|---|
| **agents' Personal VTA** | hosted farm, VTA Only session (passkey → VTA) | Track 0 (`RUNBOOK.md`) | `vtafarm.firstperson.dev` **200**, `/api/health` 200 | keeper: 0.1–0.4; *worked when* a persona of ours is in someone else's community ACL |
| **the City VTC** (+ its VTA, mediator, DID host) | Full Stack session on the farm **or** the explore stream | claimed on the farm 7 Sept (5 records in the zone) · self-host proposal 13 Sept | `vta./vtc./mediator./dids.mages.city` CNAME → `lb.firstperson.dev`, which is **still NXDOMAIN** (14 days) · the proposal's box **not created** | **the fork — §3** |
| **the front** `mages.city` | — | Workers assets | **200** (41 kB) | — |
| **Hall wiki · Portal · Exchange** | — | built, twin 68/68; always-on host = the mesh Pi (A2 done 7 Sept) | `wiki.` `portal.` **no DNS answer** | A3 tunnel → A4 seed + claim → A5 open → A6 post (keeper + builder) |
| `mages.city/farm` (the distribution page) | — | Phase 7 | **404** | after A6 |
| **the gate** | upstream's own model: a VIC policy | `gate/citykey.mjs` verifier built; the service not built | — | B4 after the VTC exists |
| **the chip** | — | `site/record.js` recomputes signatures, κ, did:key, liveness | on `/connected/` only (parked 14 Sept) | reader wiring per the nexus review |
| **binaries** | `download.firstperson.dev/{vta,vtc,pnm-server,mediator,did-hosting-daemon}/latest/` | proposal Phase 3 | all **200**, tagged **VTI-Dogwood**, built 2 Sept; `…/main/…` builds 19 Sept; **no checksums or signatures** (upstream: explore only, never a host with real keys) | pin the tagged builds; record sizes at download |
| **setup script** | `vti-setup` `scripts/setup-explore.sh`; the guide now says download from release `v1.0.0` and check `SHA256 c59f…1340` + `gh attestation verify` | runbook B2 still says `curl … main … \| bash` | release **v1.0.0 does not exist** (404); tags are `Banyan`, `archive/sysop-deploy` | run the script **from a file at a pinned commit**: `df68ba1e…`, `sha256 febbed32f68092c426b9b558b91c205319ff6569139fb82cc400e62d853ce831` (computed today from the pulled checkout); do not pipe `main` |
| **VTI source** | `~/openvtc/verifiable-trust-infrastructure` | pulled today → `d383d17e` (vta-sdk 0.45.1, vta-service 0.36.0, vta-persona 0.4.0) | — | reference only; the Windows box never builds the services (D4) |

## 3 · The one decision: where the City's VTC lives

Two paths, both documented, one blocked, one unstarted.

| | hosted farm (Full Stack) | self-host explore box (proposal 13 Sept) |
|---|---|---|
| cost | €0 | €5.99/mo (€7.09 with backups), one CX23, Ubuntu 26.04 |
| custody | the farm's Vault (better than a root-owned box) | root-owned box; upstream says *not for real keys* |
| what remains ours | B4 the gate bridge | B2 + B3 too, and the runbooks |
| blocked on | FirstPerson publishing the LB hostname (`lb.firstperson.dev` NXDOMAIN at its own nameservers since ≥ 7 Sept; the farm portal itself is up) | D1–D7 + creating the box (keeper) |
| DIDs | minted by the farm under `dids.mages.city` | minted by us under `dids.mages.city`; **the hosted farm is effectively closed once our DIDs exist** (rollback §6) |
| time | a browser session once unblocked | two evenings |

Recommendation: **set a date.** If the LB name is not resolvable by the date, go self-host and treat the farm as the agents' side only (Track 0), which is what the VTAFARM ruling already prefers for custody of other people's keys. The self-host path is fully written; its first three phases are the keeper's and need no agent in the SSH session. Either way `dids.` is plural and settled, and the four records stay DNS-only.

Not in play: running our own farm (ruled out 7 Sept; now fully documented upstream, ~€40–50/mo and a custody duty).

## 4 · Corrections to our records since 13 September

1. Binary paths changed: `vta/latest/vta`, `vtc/latest/vtc`, `pnm-server/latest/pnm` (the server build of PNM: plaintext config, no keyring — do not "correct" it to `pnm/`), `mediator/latest/{mediator,mediator-setup}`, `did-hosting-daemon/latest/did-hosting-daemon`. The `<service>-service/latest/` paths in the 13 Sept memory now 404.
2. The setup script no longer installs Node or Docker. Node only for the optional DID-hosting UI build (declares ≥ 24.3; Ubuntu 26.04 ships 22). Docker is not used.
3. Provenance: the guide's tagged-release + checksum + attestation path is written but the release is not published. Pin the commit hash above until it is.
4. `pnm acl create --capabilities memory-read,room-present` narrows an agent's entry at creation; use these names in `AGENTIC_VTI.md` §3.
5. A community may keep its join manifest private (`#1563`); applicants can withdraw and supplement (`#1591`, `#1593`).
6. A v2-template VTC issues hybrid (Ed25519 + ML-DSA) credentials; every verification path reads a proof set. The Hold's composition already returns `valid` on them.
7. Rate limits are typed and attributable (`x-rate-limit-source`); a `429` from the VTC names its limiter.
8. Runbook B2's `curl … | bash` line is superseded (see §2, setup script).

## 5 · The order, with owners

One line: **Track 0 and A3–A6 in parallel (free, no server of ours) · the Star merge and Hold wiring in parallel (no server at all) · then the §3 decision by its date · then B.**

| # | step | owner | worked when |
|---|---|---|---|
| 1 | Track 0: farm account, `pnm setup`, persona DID, join an existing community | keeper | a persona of ours in someone else's ACL |
| 2 | A3 tunnel on the mesh Pi (`cloudflared.example.yml`: portal 4445 · exchange 4448 · gate 4446 · `*` → 3333) | keeper | `wiki.mages.city` answers a byte of its own page |
| 3 | A4 seed for the production TLD, claim `wiki.` `swarm.` `portal.` from the host | keeper + builder | `status/owner.json` per site |
| 4 | A5 open the door (second sponsor ⚑) · A6 the post | keeper | the Hall has two residents and an open thread |
| 5 | Commit the `~/star` sync (11 paths) and the soulbis fiber edit; deploy soulbis | keeper | `soulbis.com/star` carries `sFiber`; `~/star` parity 8/8 |
| 6 | Real `star-key` merge (after the other window's files are committed or set aside); wire `star-hold.ts` into the pane; port proof-set composition | keeper decides order · agent runs | build, tests, tsc green on the real checkout |
| 7 | Conformance pack: one identity-vetting statement fixture; `Measured.alg` widened (measured, not verified) | agent | pack `--check` byte-stable, suite green |
| 8 | §3 decision by date | keeper | four A or four CNAME records that resolve |
| 9 | B (self-host): Phase 1 DNS · Phase 2 script from the pinned file · Phase 3 tagged binaries · Phase 4 wizards (two SSH windows) · Phase 5 units · Phase 6 verify | keeper (0, 2, 3, 4) · agent (1, 5, 6) | four HTTPS URLs answer as their own services |
| 10 | B3 the City VTC with `cnm`; CTAs; agents-only policy; **write up the bootstrap path** (the upstream guide is a stub) | keeper with the maintainers | seed pair hold a VMC + VEC |
| 11 | The first real Hold item: a VMC or a vetting statement from step 10 related into the keeper's Star; the chip reads `holds{root,count}` | agent | three verifiers, one root; `hold project` for the City |
| 12 | B4 the gate bridge (record the persona DID presented; issue → VMC + VEC; receipts) | agent | one admission end to end |

## 6 · Rulings ⚑ (this page's own)

1. The §3 date.
2. Track 0 status — has 0.1–0.4 been walked? The runbook does not record it.
3. `~/star`: commit the sync as one "parity" commit (five rooms + nav + stylesheet + signature scripts + the two linked routes), or keep `signatures/` and `star-experiment/` out of the standalone holospace and accept two dead nav links.
4. Whether the soulbis V7 fiber panel ships with the next soulbis deploy.
5. The star-key merge order against the other window.

## 7 · Sources

`docs/RUNBOOK.md` · `docs/VTAFARM.md` §3–§6 · `docs/DECISIONS_2026-09-05.md` D4–D6, D11 · `deploy/vti/README.md` · `deploy/vti/PROPOSAL_2026-09-13_self-host-explore.md` · `deploy/dns/RECORDS_2026-09-07_vta-farm.md` · `deploy/viewer/decisions.json` · `~/star-key/docs/STAR_NEXUS_REVIEW_2026-09-21.md` · `~/openvtc/vti-setup` `df68ba1` (`sysop/explore/01-server-setup.md`, `sysop/deploy/README.md`, `scripts/setup-explore.sh`) · `~/openvtc/verifiable-trust-infrastructure` `d383d17e` (`docs/02-vta/personal-ai-agents.md`, `vta-mcp/README.md`) · probes: `curl`/`nslookup` 21 Sept 2026.
