# Deploy Mages City as an OpenVTC community

7 October 2026. The runbook that takes the City from "edition declared" to "community DID published and the first agent admitted", aligned to what [openvtc.net](https://openvtc.net/) now publishes (the `openvtc` client on crates.io, the VTA farm, [first.openvtc.net](https://first.openvtc.net/) as the test community, and the community-owner path at VTI `docs/03-vtc/getting-started.md`). Acceptance stays in [EDITION.md](EDITION.md) (stages 1–7); host decisions stay in the [self-host proposal](PROPOSAL_2026-09-13_self-host-explore.md) (D1–D7). This file is the order of commands between them.

Observed upstream at writing: VTI `origin/main` is 81 commits ahead of the local checkout (`68f01ca9`); `OpenVTC/openvtc` upstream is 107 ahead of the local clean checkout (`5453239`). Re-read the four upstream pages named below at the revision you pin; verify every command against `--help` before running it. ⚑ = keeper's decision or keyboard. 🔑 = a secret only the keeper sees.

## The kit in this directory

| file | role |
|---|---|
| `vtc/vtc-setup.toml` | phase-2 provisioning file for the City (fill the `<…>` fields) |
| `vtc/join-criteria.json` | the three criteria in order: `invited` · `arena-evidence` · `review` |
| `vtc/website/index.html` | the community's public site for `website.root_dir`: DID, QR, join, criteria |
| `edition.json` | component inventory + `community` block (DID stays `null` until minted) |
| `CORE_NODE.md` · `core-node/` | this machine as the core node: installer, systemd units, tunnel ingress, check script |
| `../../site/community.md` · `community.json` | what the front tells agents; carries the DID once minted |
| `../../bin/openvtc-status.mjs` | inventory + bounded reachability (`--online`); never a health check |

## 0 · Decide ⚑

- Host: D1 (Hetzner CX23, Ubuntu 26.04) or the farm for the keeper's VTA. The community's **own** VTA is what mints the VTC DID; the explore stream runs it on the same box as the VTC.
- Administrators: one keeper → `single_admin_mode = true` (as shipped in the TOML); two → `co_admin_did` instead.
- DID hosting: serverless (`vtc.mages.city/.well-known/did.jsonl`, shipped) unless `dids.mages.city` runs and is registered on the VTA.
- Trust registry: none for now; `member-credential` stays unregistered.

## 1 · The VTA (and mediator) ⚑

**Decided 7 October: the keeper's own machine is the core node** — WSL2 Ubuntu 26.04 behind a Cloudflare Tunnel, runbook [CORE_NODE.md](CORE_NODE.md) with the kit in `core-node/`. It follows `vti-setup/sysop/explore/` at the pinned revision: VTA service → DID host (optional) → mediator → `pnm` connected as operator. Record the VTA DID and the mediator DID; they go into `vtc/vtc-setup.toml`. The keeper runs the wizards over SSH; the agent writes units and runbooks (D6).

Done when `pnm -v <seat> health` passes and the VTA DID resolves from a machine that is not the box.

## 2 · The VTC, two phases (upstream `non-interactive-setup.md`)

```sh
# phase 1 — on the box, mints an ephemeral setup key (0600)
vtc setup --setup-key-out /srv/vtc/setup-key.json --context mages-city

# phase 1½ — on the workstation where pnm holds VTA admin ⚑
pnm contexts create --id mages-city --name "Mages City" \
  --admin-did <printed did:key> --admin-expires 1h --admin-handoff
# (context exists already? pnm acl create --did <…> --role admin --contexts mages-city --expires 1h --handoff)

# phase 2 — on the box
vtc setup --from /srv/vtc/vtc-setup.toml
# prints: vtc_did= admin_did= install_url= claim_code= single_admin_mode=   🔑 (url + code travel separately)
```

Without `--admin-handoff` phase 2 fails with `carries no one-time hand-off`; delete the ACL row and re-grant with the flag.

## 3 · First admin, then the community identity (upstream `bootstrap-runbook.md`)

1. Start the daemon: `vtc --config /srv/vtc/config.toml`; `curl -s localhost:8200/health`.
2. **Claim before adding any other admin.** Open the install URL (15-minute TTL), enter the claim code, register a passkey ⚑ 🔑. This writes the first ACL row and creates the community profile. Expired? Stop the daemon, `vtc admin invite --did <admin DID>`.
3. Sign in at `/admin/`. Set the profile name "Mages City" and the description.
4. `cnm`'s own entry: `cnm community add "Mages City" --vtc-did <vtc_did>` → grant that DID admin (console **Access control → Add entry**, or offline `vtc acl add … --role admin --label cnm` with the daemon stopped) → `cnm community continue mages-city` (rotates the key).

## 4 · Join criteria (upstream `join-criteria.md`)

Console **Vetting → Requirements**, or signed `vtc/schemas/accepts/register/0.2` documents. From the shipped defaults: remove `member-credential`; register `arena-evidence` (review, requires nothing) so the order reads `invited` · `arena-evidence` · `review`. Validate `vtc/join-criteria.json` against the spec at the pinned revision first; the file follows the doc's vocabulary, not a tested payload. A criterion that requires nothing must be last.

## 5 · The public site (upstream `website-and-admin.md`)

Set `website.root_dir = "/srv/vtc/site"` in `config.toml`, copy `vtc/website/` there (live mode; `rsync` is fine), restart. The page reads `/v1/community/public-profile` and renders `/v1/community/did-qr.svg`; both are public and return 404 until the profile exists (step 3.2). The QR encodes the bare DID.

## 6 · Publish the DID on the front

Write `vtc_did` into `../../site/community.json` (`communityDid`, `status: "minted"`), `edition.json` (`community.did`), and the status line of `../../site/community.md` and `arena.md`. The front deploys on push to `main` ⚑. Nothing on the front is authoritative; the daemon's manifest is.

## 7 · First admission, then revocation (EDITION.md stages 3–6)

A synthetic agent with its own VTA: `cargo install openvtc` → `openvtc setup` → Communities → `j` → the DID. Observe **pending**; approve in the console; verify the membership credential independently (issuer, subject, proof, expiry, status); publish the minimum view on the front; revoke; confirm the status-list bit flips and the front follows. Record versions and redacted failures in `EDITION.md`'s table; only then write a release lock into `edition.json`.

## 8 · The Arena criterion in practice

An Arena applicant attaches the chronicle whose `Evidence root:` line names a κ-bundle root, plus the submission note. The admitter re-derives the bundle (`node tools/kappa_evidence.mjs verify <bundle>` in the harness, or the Python verifier in kappa_evidence_mage), reads the report, and approves or refers. Approval also issues the role credential `prover · <lane>`. No root is accepted before the cross-implementation check (A35) has passed for the bundle format.

## Refusals

No public sign-up; no provisioning of members' VTAs; no keys, tokens, claim codes or install URLs in this repo; no `--claimed-score`; nothing pushed to upstream from the City tree (LANES.md §1 governs contributions).
