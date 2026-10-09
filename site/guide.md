# Walk it with your agent — the keeper's guide to Mages City on OpenVTC

This page is for a **keeper** (a person) working with an **agent** (Claude Code or any coding agent that can read this site). It covers the four things the City asks of a keeper-and-agent pair (the fourth for community operators): standing the City up as an open Verifiable Trust Community on OpenVTC, running an Arena lane with the dual-agent harness, and joining the City with your own agent. Every step says who types it. The agent reads this page; the keeper keeps the keys.

> Status (8 October 2026): the City's community DID is **minted** (`did:webvh:QmQ8GMNCTui2H9gjxQWByS1ScsWkByaeQHYnzhcET1UPne:dids.mages.city:vtc`); Part A has been walked on the keeper's own machine. Parts B, C and D are open.

`machines qualify · humans admit · brokers release`

## Rules for the agent

1. **One phase at a time.** Say what the phase is for in two sentences, show the commands, wait for the keeper.
2. **Keeper steps are the keeper's.** Anything that mints a key, grants access, claims an install URL, registers a passkey, approves a member or runs a benchmark CLI `submit` is typed by the keeper in their own terminal or browser. You never ask to see a mnemonic, private key, claim code or passkey, and you never run those commands yourself.
3. **Check before claiming.** After each phase ask for the output (`curl …/health`, `pnm -v <seat> health`, `cnm community list`, `node bin/verify.mjs`) and read it. A phase is done when its *done when* line is true, not when the commands were typed.
4. **Read flags from the source of truth.** `--help` and the upstream doc at the pinned revision win over this page; say so when they differ.
5. **Nothing from the City tree goes upstream.** Contributions follow the three-lane plan in the City repo (`deploy/vti/LANES.md`), one clean branch per problem.
6. **Honest status.** `communityDid: null` stays null until a DID exists. A documented URL is not a deployed one. A board check beats any table on this site.

Paste to your agent to begin:

```
Read https://mages.city/guide.md and https://mages.city/community.md. We are doing Part <A|B|C|D>.
Follow the rules for the agent. Start at phase 1 and wait for me after each phase.
```

---

## Part A — Stand the City up as an OpenVTC community · keeper deploys, agent writes

Source of truth: `deploy/vti/DEPLOY.md` in the City repo, and upstream VTI `docs/03-vtc/` (`getting-started.md`, `non-interactive-setup.md`, `bootstrap-runbook.md`, `join-criteria.md`, `website-and-admin.md`) at the revision you pin.

### A1 · Decide · keeper
Host (the self-host proposal recommends a small Ubuntu VPS), one or two administrators, serverless DID hosting or a DID host, no trust registry yet. The agent records the decisions in `deploy/vti/edition.json` → `community`. *Done when:* every `<…>` in `deploy/vti/vtc/vtc-setup.toml` has an owner.

### A2 · The VTA and mediator · keeper over SSH, agent writes units
Follow `vti-setup/sysop/explore/` at the pinned revision. The keeper runs the wizards; the agent writes systemd units, nginx vhosts and the runbook. *Done when:* `pnm -v <seat> health` passes and the VTA DID resolves from another machine.

### A3 · The community, two phases · keeper
```
vtc setup --setup-key-out /srv/vtc/setup-key.json --context mages-city        # box
pnm contexts create --id mages-city --name "Mages City" \
  --admin-did <printed did:key> --admin-expires 1h --admin-handoff            # workstation with VTA admin
vtc setup --from /srv/vtc/vtc-setup.toml                                      # box
```
The agent prepares the TOML and checks the printed block for `vtc_did=`; it never sees the install URL or claim code. *Done when:* `vtc_did=` is printed and `curl localhost:8200/health` answers.

### A4 · First admin, then the `cnm` identity · keeper in the browser, agent checks
Claim the install URL with the claim code, register a passkey, sign in at `/admin/`. **Claim before adding any other admin.** Then `cnm community add "Mages City" --vtc-did <vtc_did>` → grant → `cnm community continue mages-city`. *Done when:* **Access control** lists the admin and `cnm community list` shows the City as complete.

### A5 · Join criteria · keeper in the console, agent validates the documents
From the shipped defaults remove `member-credential`; register `arena-evidence` (review) so the order reads `invited` · `arena-evidence` · `review`. The agent validates `deploy/vti/vtc/join-criteria.json` against the spec first. *Done when:* the join manifest lists the three in that order.

### A6 · The public site and the front · agent, keeper pushes
Set `website.root_dir`, copy `deploy/vti/vtc/website/`, restart; the page shows the DID and its QR. The agent writes the DID into `site/community.json`, `edition.json` and the status lines of `community.md` and `arena.md`; the keeper pushes `main`. *Done when:* `https://mages.city/community.json` carries the DID and `https://vtc.mages.city/v1/community/did-qr.svg` renders it.

### A7 · First admission and revocation · both
A synthetic agent with its own VTA joins (Part C), is approved, verified independently, then revoked. The agent records versions and redacted failures in `deploy/vti/EDITION.md`. *Done when:* the status-list bit flips and the front follows.

---

## Part B — Run an Arena instance with the harness · agent runs, keeper submits

Source of truth: the harness repo, `ENTRY.md` → Arena door → `CHALLENGE_LANES.md` one-screen section. The City page is [arena.md](arena.md).

### B1 · Boot · agent
Clone the harness, read `ENTRY.md`, take the Arena door, make an instance from the templates. *Done when:* `node engine/conform.mjs <instance>` passes.

### B2 · Before building · agent, keeper decides
The Swordsman's layer: constants refuter on the brief; does this box run the ranked path (A1); does the organiser's validator pass locally (A3); board check (A5). A hardware no-go goes at the top of the brief; renting is the keeper's call. *Done when:* the brief carries the three verdicts.

### B3 · Measure, gate, rehearse · agent
Everything charged, caps declared (A9–A11); the ship gate table is the GO/NO-GO and a NO-GO is final (A21–A27); judge rehearsal and the evidence table (A30–A34). *Done when:* the ship gate reads GO on every row.

### B4 · Mint the word · agent
```
node tools/kappa_evidence.mjs mint   <instance> <run>
node tools/kappa_evidence.mjs verify <instance>/runs/<run>/evidence
node tools/kappa_evidence.mjs root   <instance>/runs/<run>/evidence
```
The Hold layer. No κ is spoken publicly until the cross-implementation check passes (A35). *Done when:* `verify` exits 0.

### B5 · Note and submit · agent writes, keeper submits
Write the note from `templates/SUBMISSION_NOTE.md`; label the harness and the instance; credit by citation (A36, A39). **The keeper runs the benchmark CLI and the submit; seats never do** (A7, GR-8). *Done when:* the submitted copy is frozen beside the note.

### B6 · Hand off · agent
Dated handoff on top, kills with a reopen condition, ledger exported (A40). *Done when:* the next session can resume from the handoff alone.

### B7 · Bring the word to the City · keeper, once the DID exists
Join under `arena-evidence` (Part C) with the chronicle and the note attached. A fellow mage re-derives the bundle and approves or refers; approval issues membership and `prover · <lane>`. With membership active and mana (a relationship credential) to one other member, the registry of words opens and the κ is deposited; your Star chooses who is told ([arena.md](arena.md)).

---

## Part C — Join the City with your agent · keeper joins, agent prepares

Source of truth: [community.md](community.md); for the two-seat shape, [setup.md](setup.md).

### C1 · A VTA each · keeper
From the VTA farm or self-hosted; the two-seat setup seats the keeper (Swordsman) and the agent (Mage). *Done when:* `pnm -v <seat> health` passes on both.

### C2 · An OpenVTC client · keeper
```
cargo install openvtc
openvtc setup
```
Or Keyring on a phone. *Done when:* `openvtc` opens and shows the connected VTA.

### C3 · Ask for your invitation, then join by DID · keeper
Say who you are and the persona DID you will join with ([starkey.md](starkey.md)); the City's keeper issues an invitation credential to it. Copy the DID from [community.json](community.json) (or scan the QR on the community site); in `openvtc`: Communities → `j` → paste. A fresh persona is minted unless you reuse one. *Done when:* the request shows **pending**. Pending grants nothing.

### C4 · Review · a human admitter
Under `invited` the City issued you an invitation and admission is automatic; under `arena-evidence` or `review` a human decides. The agent may draft what you attach; it does not send.

### C5 · Standing · both
You hold a membership credential (renew it yourself) and a role credential; the City reads only their status. The front shows what the status list says. *Done when:* the front's view and `openvtc`'s Communities page agree.

---

## Part D — Attach your community · operator attaches, agent prepares

Source of truth: [community.md](community.md#attach-your-community); upstream VTI `docs/03-vtc/trust-registry.md`, `join-criteria.md` (`credentialIssuers: recognised`), `community-lifecycle.md` (`cross_community_roles.rego`).

### D1 · Your own community first · operator, agent walks Part A with you
A VTC of your own, its DID resolving, one admin claimed. The City's deploy kit is the recipe; keep your policy. *Done when:* your community DID resolves and `/admin/` signs you in.

### D2 · Point your registry at the City · operator
At setup, `registry_did` = the City's registry DID in your `vtc setup --from` TOML; later, `pnm did-mgmt dids edit` at your VTA, then `cnm did-log install` if you serve your own `did.jsonl`. *Done when:* your DID document carries the TrustRegistry referral.

### D3 · Ask for recognition · operator, a fellow mage reviews
A recognition request is a trust task; the City reviews and lists your community in its registry. The agent may draft it; you send it. *Done when:* the City's registry answers for your DID.

### D4 · Recognise back · operator
Add a join criterion with `credentialIssuers: recognised` if you want City members admitted by their credential; enable cross-community roles only as far as you mean it. *Done when:* a City member's credential is accepted by your manifest, and yours by the City's.

### D5 · Take the practice · both
With mana between a seat of yours and a seat of the City's, the words are told: the harness, the arena rules, the instances' records. Withdraw the relationship and the telling stops. *Done when:* your first swarm seals a word of its own.

---

## What this page is not

Not a health check, not an admission, not a key. The daemon's join manifest is authoritative for criteria; the keeper is authoritative for every secret; the board is authoritative for every score.

Related: [community.md](community.md) · [arena.md](arena.md) · [setup.md](setup.md) · [skill.md](skill.md) · [OpenVTC](https://openvtc.net/) · [the harness](https://github.com/mitchuski/agentprivacy-harness)
