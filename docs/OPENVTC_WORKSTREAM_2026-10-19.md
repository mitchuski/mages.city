# OpenVTC on Mages City · the workstream (opened 19 Oct 2026)

Mitch: "update my openvtc mages city, run it in the wsl box · so it shows · then work on making it easier to join the community · management of the vta farm admin interface, get that all going for me to workshop and build around · showing a clear implementation and customisation of openvtc via mages city is important · this will be an extended workstream."

The thesis for the workstream: **Mages City is the worked example of an OpenVTC community customised for agents.** Every slice keeps one table honest: what upstream ships · what the City set · what the City added (§4).

## 0 · Where the node stands (19 Oct, 13:40 BST)

| | state |
|---|---|
| distro | `mages-core` on D:, user `privacymage`, systemd |
| vta · vtc · pnm · mediator · mediator-setup | **updated** to the `latest` channel (built 15 Oct; still report vta 0.56.0 / vtc 0.11.58: the channel lags the 18 Oct tags vta 0.64.0 / vtc 0.12.0) |
| did-hosting-daemon | **held** on the 2 Sept 0.8.3 build. The 15 Oct build refuses the in-store secrets (`no secrets found`), same wall as 8 Oct. `install-binaries.sh` now has `HOLD=did-hosting-daemon` so updates skip it. Option B (KEEPER_ACTIONS §5 gotcha) lifts the hold. |
| snapshot | `~/vti/rollback/20261019T123234Z` (pre-update binaries + state) |
| public | dids · vta · vtc health · public-profile all 200; mediator DID resolves |
| `/` on vtc.mages.city | **upstream default landing** ("Verifiable Trust Community"); `website.root_dir` not set |
| `/admin/` | console live (passkey · wallet · VTA identity), `single_admin_mode = true`, no `plugin_dir` |
| `/members/` | upstream member portal shipped in the build, unused (no members yet) |
| criteria | not yet set by the City (DEPLOY §4 open); upstream defaults are `invited` (auto) · `member-credential` (auto) · `review` |

## Progress · 19 Oct, same session

- **Slice 1 DONE.** Keep-alive task registered + running · `wait-for-dids.conf` drop-in on mediator/vta/vtc · **join.mages.city LIVE** (VTC host mode: API/console `vtc.`, website `join.`; CSP override; CORS `join.` + `mages.city`; tunnel + DNS route) · front band dot reads live health, "get in" → join., `site/found.html` (create your own mage) · health probes send `Host:` (strict host mode).
- **Slice 3 started.** `admin_ui.plugin_dir` set; the **keeper's desk** plugin `mages-city` (Overview) served by the console; checked in a stub shell (needs the keeper's sign-in to see it in place).
- **Template:** `docs/OPENVTC_CUSTOMISATION.md` (the map + upstream gaps + template pieces).
- **Keeper acts waiting (console, passkey):** Vetting → Requirements: register `work-evidence` (review) between `invited` and `review`, remove `member-credential` (the desk shows the diff) · issue a first invitation (Invitations) · first synthetic admission + revocation.
- Front changes (`found.html`, header, status.js, CSS) are local until pushed.

## Progress · 19–20 Oct

- **First real member, 19 Oct 21:20 BST:** `february-sphere` (First Person farm persona) joined over DIDComm with the `openvtc` TUI, referred under `review`, approved by the keeper in the console at 21:46. The Agent door (§2) is proven; what it needed was a VTA, the community DID and the keeper's approval.
- **The Human door needs the DID document fixed:** a wallet joining by the City's DID (Star Key 🤝, built 20 Oct) stops at `join/no-service` because the document lists no `TrustTaskHTTPS` / `SignInPortal` (VTI added them 10–11 Oct). The update is staged on the node; publishing is blocked by the 0.8.3 DID host (Option B). Same gap at first.openvtc.net.
- **MyTerms (IEEE 7012) at the door:** Star Key proffers a roster agreement on "Ask to join" and sends it inside the signed request; the City's configuration (accepts `SD-BASE-DP`, `SD-BASE`) is in `deploy/vti/vtc/website` and the `MyTerms` service is in the staged DID document. Mages City is the first community that takes terms.
- **The Human door's document is published (20 Oct 23:55 BST):** the DID host was upgraded in place (new host DID `QmQrSN8…`, KEEPER_ACTS §6) and the City's DID document is at version 3 with `TrustTaskHTTPS` (`vtc.mages.city/v1`), `SignInPortal` (`join.mages.city/members/`) and `MyTerms`. The wallet's join traffic goes to `vtc.mages.city/v1/trust-tasks`, which 0.11.58 serves; the two join.mages.city pages answer 404 until the website files (MyTerms + a members landing page) are copied to the node. First VTC still lacks the two services; its operators hold that step.
- **Our mage knocked at The First VTC (21 Oct 01:35 BST):** with the DID host fixed, the `openvtc` TUI minted a fresh persona `did:webvh:QmRYnVZAoPZ1eAyxaXPShqBUu8S3bCbPanm42ymDJMnQR8:dids.mages.city:safe-model` in its own context (`openvtc/qme5theer1qr`) through the City's VTA and sent an **open request** over TSP, registry publication consented; status Pending, awaiting their moderators. The step that froze on 20 Oct ("Creating persona DID via did-hosting-daemon") took one second.
- Keeper acts and evidence: `docs/KEEPER_ACTS_2026-10-20.md`.

## 1 · So it shows (slice 1)

1. **Keep-alive.** `vmIdleTimeout=-1` keeps the VM, not the distro: `mages-core` stops ~seconds after the last Windows-side process detaches (seen 13:35→13:38 today). Fix: a logon Scheduled Task running `wsl.exe -d mages-core --exec /bin/sleep infinity` hidden (⚑ keeper approves the task). Plus sleep Never on AC.
2. **Cold-boot order.** On a fresh boot the VTC and mediator start before the tunnel serves `dids.`; they retry, but add `After=cloudflared.service` + a wait-for-dids `ExecStartPre` to vti-mediator / vti-vta / vti-vtc.
3. **The City's face on vtc.mages.city.** `website.root_dir = ~/vti/vtc/website`, live mode, seeded from `deploy/vti/vtc/website/` and built from the front's palette: the community, its criteria (read live from the manifest), a Join door, and the profile. Deploy by `POST /v1/website/deploy` once the console token is in hand, or by file copy (live mode).
4. **mages.city status line** reads `vtc.mages.city/health` + public-profile and says up/down honestly.

## 2 · Easier to join (slice 2)

Today a joiner needs: a VTA, the `openvtc` client, the community DID, and an admin to act. Make it three doors, one page each, every one ending in a real `join-requests/submit`:

| door | who | path |
|---|---|---|
| **Invited** | anyone the City invites | admin issues an invitation in the console → a link/QR → `invited` admits automatically |
| **Agent** | an autoresearch agent with a VTA (harness, vta-mcp) | one paste-to-agent command: `openvtc join <communityDid>` with the Arena chronicle as evidence → `work-evidence` (review) |
| **Human** | a person with a wallet | wallet / passkey via the member portal once admitted; before that, the `review` criterion |

Work items: register the City's criteria (`invited · work-evidence · review`, from `deploy/vti/vtc/join-criteria.json`, validated against `vtc/schemas/accepts/register/0.2`); an invitation runbook + an "Invite" button the keeper can use from the console; one join page on vtc.mages.city and mages.city/join.html pointing at the same thing; the first synthetic admission + revocation as the proof (DEPLOY §6).

## 3 · The admin interface to workshop in (slice 3)

The console takes **plugins** (`admin_ui.plugin_dir`, ES module + `manifest.json`, appears in the nav, no rebuild). That is the City's customisation seam:

| plugin | does |
|---|---|
| `mages-city` | the City at a glance: node health, binaries (held/current), criteria in force, pending join requests, invitations out |
| `arena-review` | the `work-evidence` queue: each application's κ root and chronicle, verify in place, approve → VMC + `prover · <lane>` role |
| `seats` | the lattice seats (arena.json `lattice.seated`), who holds what, flip owed |
| `farm` | the VTA-farm view: the City's VTA contexts, the DID host, the mediator; what an attached community would get |

Plugins live in `deploy/vti/vtc/admin-plugins/`, synced to the node. Workshop loop: edit locally → `sync` → reload `/admin/`.

## 4 · The customisation map (the deliverable that shows)

`docs/OPENVTC_CUSTOMISATION.md` + a page on the front: per surface (VTA · DID host · mediator · VTC config · criteria · website · console plugins · member portal · trust registry), three columns **upstream default · the City's setting · why**. Updated every slice; this is what another community copies.

## 4b · How the keeper's experience changes (Mitch's ask, 19 Oct)

| stage | before (to 19 Oct) | after the slice |
|---|---|---|
| **0 · the node** | WSL box ran only while a terminal was open; updates were a night of migration; what was running was unclear | runs from logon (Scheduled Task); one update spell with snapshot + rollback + a HOLD list; `check.sh` says what's current, held, up |
| **1 · it shows** | vtc.mages.city showed upstream's generic landing; mages.city and the VTC were two separate places | vtc.mages.city *is* Mages City: same palette, the profile, the criteria in force, a Join door; mages.city's status line reads the live node |
| **2 · joining** | a joiner had to know DIDs, CLIs and wait for you to act in a console you rarely open | three doors on one page: **Invited** (you press Invite, they follow a link, admitted automatically) · **Agent** (one paste-to-agent command, Arena evidence → your review) · **Human** (review, then the member portal). You only ever *approve* |
| **3 · the console** | the console was upstream's: members, ACL, policies | the console is the City's workshop: overview, Arena review queue with κ roots verified in place, seats, farm view, as plugins you can change without rebuilding anything |
| **4 · the overlap** | "we use OpenVTC" was a claim in the docs | the customisation map shows, surface by surface, upstream default · City setting · why; another community can copy it |

Order of feel: **it stays up → it looks like the City → people can get in → you run it from your own console → others can copy it.**

## 5 · Open ⚑

- Scheduled Task for keep-alive (slice 1.1).
- Option B for the DID host (lifts the hold; keeper ceremony, passkey + VTA).
- `single_admin_mode` stays true until a co-admin is named.
- Criteria order and whether a no-requirement `review` criterion stays last.
- Pushes: Mitch.
