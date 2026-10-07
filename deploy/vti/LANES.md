# OpenVTC, Mages City and the Star

23 September 2026. Three lanes, one feedback loop: build with upstream, experiment in the City, contribute what proves useful. This is the concise plan; [EDITION.md](EDITION.md) holds deployment acceptance details.

## 1. Contribute directly to OpenVTC

Clean local checkout: `~/openvtc/openvtc`, remote `upstream` = `https://github.com/OpenVTC/openvtc.git`, `main` tracking `upstream/main`. Initial inspected commit: `5453239b5604b2c76dba9ac87d74c522d95af2d7`. Cargo metadata resolves the two workspace members and their Rust 1.95 requirement; compilation and runtime behaviour have not been verified.

Use this checkout to understand and reproduce upstream behaviour. Make each contribution in an isolated worktree/branch from current upstream. Add a personal GitHub fork as the publishing remote when there is a contribution to send; no public fork or upstream push was made during this setup. Never merge the entire City or Star branch into an upstream PR.

Targets: CLI/TUI and configuration work goes to `OpenVTC/openvtc`; services, protocols and SDK work goes to `OpenVTC/verifiable-trust-infrastructure`; operator instructions go to `OpenVTC/vti-setup`.

The CLI repository's CONTRIBUTING.md asks for a GitHub Discussion before an issue/PR, conventional commits, DCO sign-off and a CLA. Its linked individual CLA file is absent in this checkout, so clarify the current mechanism with maintainers; do not invent or sign an agreement for the contributor. Its branch guidance mentions `development`, which is not an advertised remote branch at this inspection; confirm the intended contribution base in the discussion.

**Suggested first work:** propose a small contributor-onboarding documentation correction. Verified discrepancies: Rust 1.91 in CONTRIBUTING.md versus 1.95 in Cargo metadata; absent `development` branch; absent linked `.github/CLA/INDIVIDUAL.md`. Discuss the intended replacements, then submit only confirmed corrections. In parallel, follow review on existing vti-setup PRs 42 and 43.

**Next substantive work:** run the ordinary persona → join → approval → credential lifecycle using upstream clients and capture reproducible failures. Select one bounded defect with a regression test. Read current issues before starting; earlier suggestions VTI 1651/1652 are closed. Do not start with the broad admin-signing/security backlog as an uncoordinated first patch.

## 2. Use Mages City as the agentprivacy experimental community

Home: `~/mages_city` (`mitchuski/mages.city`). It owns the community's site, branding, agent admission policy, Portal/Hall/Exchange integration and deployment configuration. Upstream components supply the trust infrastructure.

The earlier VTC subdomains and hosting work were exploration, not a confirmed deployed community. Preserve those notes as research; do not make recovering an old claim a prerequisite. Inspect it if useful, otherwise choose hosting deliberately. No new infrastructure purchase or identity minting follows from this plan alone.

**First experiment:** one synthetic agent brings a persona/VTA, requests admission, receives human approval and the supported membership credential, then loses access after revocation. Record pending, denied, approved, revoked and unavailable states distinctly. First prove this using upstream clients; then reflect the verified state in the City. A wiki page or visual badge must not create authority.

**Second experiment:** connect one City activity (for example an Exchange offer) to that verified membership. Keep the policy specific and test the negative case: a revoked member cannot perform the gated activity. Use supported credential and transport interfaces rather than creating City-specific replacements.

Output: a repeatable test deployment, a compatible-version record and a tested generic bootstrap guide suitable for vti-setup. City policy and identity remain here. The City is not assumed to host members' keys.

## 3. Develop the Star as an identity and trust-graph interface

Homes: `~/star-key`, `~/star`, and the existing agentprivacy runtime projects. The existing browser-plugin-derived work remains the prototype; it is not restarted or copied into the CLI repository.

**Product ambition:** replace wallet-style navigation with a view of identity, relationships, communities and evidence. The Star may eventually become an OpenVTC interface, subject to maintainer agreement and demonstrated usability. Replacing the wallet experience does not itself replace key custody, signing, consent or credential verification; those functions still need explicit implementations and boundaries.

**First experiment:** present one real community relationship from the City's admission test. Show the issuer, subject, community, evidence source and current status. Distinguish a verified assertion from an inferred graph connection. Pending, revoked and unknown must remain visible; a graph edge is not automatically a trust score or an authorisation.

**Second experiment:** compare the same join-and-review task in the upstream interface and the Star. Record completion, confusing steps and whether people can explain what a relationship proves. This is the evidence for an upstream UI proposal, rather than a proposal to merge the whole Star experiment.

**Possible upstream progression:** demonstrate the external UI → agree a minimal interface contract → extract an optional presentation component → propose an opt-in integration in the appropriate OpenVTC client. Browser-plugin presentation work belongs first with that client; shared protocol changes belong in VTI. Upstream adoption is an aim, not an assumed commitment.

## Work order

1. Upstream: establish a reproducible build environment and discuss the onboarding-doc discrepancies; keep existing setup PRs moving.
2. City: choose a test host and complete one admission/revocation journey with upstream clients. Record the exact tested versions.
3. Contribution: turn the verified deployment steps or one discovered defect into a small upstream change.
4. Star: use the same credential evidence in the existing interface and evaluate it against the upstream experience.
5. Integration: propose the smallest reusable component only after the experiment demonstrates its value.

Run `node bin/openvtc-status.mjs` from the City checkout for the local inventory, or add `--online --json` for public reachability observations. Neither establishes service readiness. Keep upstream release pins and experimental revisions separate. Preserve existing uncommitted work; pushing City main can deploy the live site.
