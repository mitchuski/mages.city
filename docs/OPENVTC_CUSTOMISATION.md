# OpenVTC, customised for Mages City · the map a founding mage copies

Every surface of the stack: what upstream OpenVTC ships, what the City set, and why. The City changes **configuration, content and plugins only**. No fork, no patched binary. So the whole customisation is a set of files a founding community can take and re-parameterise (§3). Kept current by each slice of `docs/OPENVTC_WORKSTREAM_2026-10-19.md`. State as of 19 Oct 2026.

## 1 · The map

| surface | upstream default | Mages City | why |
|---|---|---|---|
| **Where it runs** | a VPS (explore stream: nginx + certbot, `nohup`) | the keeper's machine: WSL2 distro `mages-core` on D:, systemd units, Cloudflare Tunnel | the keeper owns the hardware; the tunnel means no open ports and no certificates to renew |
| **Staying up** | n/a (a VPS is always on) | `.wslconfig vmIdleTimeout=-1` + logon Scheduled Task `mages-core keep-alive` + sleep Never | WSL stops an idle distro even when the VM stays; the task holds it |
| **Boot order** | start by hand | drop-in `wait-for-dids.conf` on mediator/vta/vtc: after cloudflared, wait for `dids.` publicly | each daemon resolves its own `did:webvh` through the public DID host at start |
| **Binaries** | download `latest` | `install-binaries.sh` records our own SHA-256 pins; `update-binaries.sh` snapshots + rolls back; `HOLD=did-hosting-daemon` | upstream publishes no checksums; the DID host's newer builds refuse its stored secrets (Option B open) |
| **VTA** | one per operator | the City's issuing VTA at `vta.mages.city` (contexts per role; Star Key connected as `swordsman`) | "a VTC always depends on a VTA"; agents bring their own VTAs (the City is not a farm, `VTAFARM.md`) |
| **VTC admin** | co-admin or single | `single_admin_mode = true` until a co-admin is named | one keeper today; succession is planned on the lattice |
| **Routing** | path mode (one host) | **host mode**: API + console on `vtc.mages.city`, community website on `join.mages.city`, strict | a filesystem website must not share the console's origin (the daemon refuses to start otherwise) |
| **Public website** | built-in landing (profile + health) | the **community-site template** (`deploy/vti/vtc/website/`): doors, live criteria, DID + QR, the "found a community" offer, from one `community.config.json` | the face of the community is the community's own; live data, not copies |
| **Website CSP** | `default-src 'self'` | `.vtc-website.toml` adds only `connect-src` + `img-src https://vtc.mages.city` | the page on `join.` reads the API on `vtc.`; scripts stay `'self'` |
| **CORS** | none | `https://join.mages.city`, `https://mages.city` | the community site and the City front read public endpoints |
| **Join criteria** | `invited` (auto) · `member-credential` (auto) · `review` | *intended:* `invited` · `work-evidence` (review) · `review`; *live:* still the defaults (registration is a keeper act in the console) | the City admits agents on evidence of work; no trust registry chosen yet, so `member-credential` adds nothing |
| **Console** | built-in plugins | `admin_ui.plugin_dir` + the **keeper's desk** plugin `mages-city` (Overview): doors → console acts, criteria intended vs live, node + holds, the public face | customise the console without rebuilding it; every signed act stays on the built-in pages |
| **Member portal** | `/members/` (vtc 0.12) | not in the running build (latest channel = 0.11.58); the template hides its link (`memberPortal: false`) and, since the DID document names `join.mages.city/members/` as the `SignInPortal`, serves a static landing page there (`website/members/index.html`) until the build does | honest pages: show only doors that exist; a named door must answer |
| **Profile** | empty | name, Privacy-is-value description, contact, logo | read live by every page |
| **Front** | n/a | `mages.city` (Workers): band dot reads `vtc.` health, "get in" → `join.`, `found.html` | the City and its community are one place |

## 2 · Upstream gaps found on the way (contribution candidates)

- **Plugins cannot sign.** `window.VtcPluginApi` exposes `registerPlugin` + `toast`; the console's signed reads (`postSignedRead`) are not offered, so a plugin cannot list join requests, members or invitations. A signed-read helper on the plugin API would let community desks show queues, not just links.
- **`latest` lags tags.** The download channel served a 15 Oct build reporting vta 0.56.0 / vtc 0.11.58 while vta 0.64.0 / vtc 0.12.0 were tagged 18 Oct; no checksums published.
- **DID host secrets migration.** Newer `did-hosting-daemon` builds refuse a store whose secrets were sealed by the 2 Sept build; the path is a re-setup of the host's own identity (Option B).

## 3 · The template (create your own mage)

What a founding community takes, and the parameters it changes:

| piece | files | parameters |
|---|---|---|
| node kit | `deploy/vti/core-node/` (install/update/migrate/check, units, drop-in, tunnel, wslconfig) | distro, user, hostnames, tunnel name |
| community site | `deploy/vti/vtc/website/` + `bin/sync-website.sh` + `bin/preview-website.mjs` | `community.config.json` (name, voice, doors, palette, links, `api`, `memberPortal`, `found`), `logo.svg`, `API_HOST`, `SITE_HOST`, `CORS_EXTRA` |
| keeper's desk | `deploy/vti/vtc/admin-plugins/` + `bin/sync-console.sh` | `intended-criteria.json`, desk links (`SITE`) |
| MyTerms (IEEE 7012) at the door | `deploy/vti/vtc/website/myterms/` + `.well-known/myterms-configuration` (what the City accepts: `SD-BASE-DP`, `SD-BASE`; counter-offer `SD-BASE-DP`) · `MyTerms` service in the community DID document · desk card (accepts · DID-document check · agreements received) | accepted codes, counter-offer; the roster is Customer Commons' and never minted here |
| criteria | `deploy/vti/vtc/join-criteria.json` | the community's ways in |
| the walk | `deploy/vti/KEEPER_ACTIONS.md`, `CORE_NODE.md`, `DEPLOY.md` | who types what; the agent prepares and checks, the keeper holds keys |

Next for the template (workstream §3–§4): pull the Mages City literals (`mages.city`, `privacymage`, `mages-core`) into one `community.env`, so `found/<community>/` is a copy plus one env file. Add a second desk plugin (`arena-review`). Write a founding walk an agent can run end to end against a fresh box.
