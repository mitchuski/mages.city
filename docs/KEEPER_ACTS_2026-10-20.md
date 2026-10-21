# Keeper acts · 2026-10-20 · the three acts the console is waiting for

Prepared by the reflection lane on the night of 19 to 20 October. Every act below is the keeper's: it needs the passkey, and nothing here was performed. What was done tonight is the checking, so that each act is one sitting.

## Progress · 20 Oct (synced from the VTC journal and the day's work)

| act | state | evidence |
|---|---|---|
| 3 · first admission | **DONE 19 Oct, real not synthetic.** `did:webvh:Qmcf1h23CMf34bLB3NiEvep4hWpfGZBp1FJ3yKQwqS85Tr:dids.firstperson.dev:february-sphere` (a persona on the First Person farm, DID created 20:20Z) sent `vtc/join-requests/submit/0.3` over **DIDComm** through the mediators at 21:20:40 BST; its VP carried a credential array but no invitation, so the `review` criterion (digest `zQmV4x4…`) referred it; the keeper signed in to the console at 21:31 and decided it (`vtc/join-requests/decide/0.1`) around 21:46; then members/show, credentials, relationships graph. The Agent door of the workstream (§2) works end to end with the `openvtc` TUI. | journal `vti-vtc` 19 Oct 21:20–21:47 |
| 1 · criteria | unknown from outside: the manifest is a signed trust task, not a public GET. The decision ran under `review`; whether `work-evidence` is registered and `member-credential` removed is read in the console (Vetting → Requirements) | — |
| 2 · invitation | not evidenced in the journal (no `vtc/invitations/*` on 19 Oct; `invitations/list` today) | — |
| 4 · DID services | **DONE 20 Oct 23:55 BST, version `3-QmRgJpMvcVJzL7rttwo666DnMUjCUjdkRYXw6xJkQ8BHA7`.** First try 14:53 failed at the 0.8.3 DID host (`missing G ciphertext frame`); Option B was then performed the same evening (§6 below): new DID host identity `did:webvh:QmQrSN8iu7VYW5QdvBt675qkQR6yWuEaL9xwsAox8WSmY8:dids.mages.city`, VTA re-pointed, the `vtc` path handed to the VTA in the manager, then `dids edit` published. `https://dids.mages.city/vtc/did.jsonl` serves three entries; the head lists `TrustTaskHTTPS`, `SignInPortal`, `MyTerms` beside the earlier five. | journal `vti-vta` / `vti-dids` 22:50–23:55; public log |
| 5 · MyTerms files | **DONE 21 Oct 01:40 BST.** `myterms/{configuration.json,agreements.json,index.html}` and `members/index.html` copied to `~/vti/vtc/website` (live mode); all four answer 200. Gotchas: files copied from `/mnt/c` carry the execute bit and vtc refuses them (`403 forbidden: file has executable bit set`) → `chmod 644`; the website never serves dot-paths, so `.well-known/myterms-configuration` is 404 and the canonical address is the one in the DID document, `/myterms/configuration.json`. `memberPortal` flipped to true (repo + node) since `/members/` now exists. Desk plugin re-synced (Reload plugins in the console still to click). | `curl https://join.mages.city/myterms/configuration.json` |

Star Key the same day: join by DID (🤝: scan the page, paste, camera, image) and MyTerms at the join door, both built, tests green, uncommitted in `~/star-key`. The First VTC (first.openvtc.net) has the same DID-document gap as the City; its operators were asked.

**21 Oct 01:35 BST — the City's mage applied to The First VTC** (runbook Part 1.1): persona `did:webvh:QmRYnVZAoPZ1eAyxaXPShqBUu8S3bCbPanm42ymDJMnQR8:dids.mages.city:safe-model`, context `openvtc/qme5theer1qr`, open request over TSP, publication in their trust registry consented; Pending. Evidence: `vti-vta` "did:webvh created and published" and `vti-dids` "DID atomically registered … safe-model" at 00:35:30Z; `https://dids.mages.city/safe-model/did.jsonl` resolves (version 1). The empty context `openvtc/mage` from the frozen attempt remains; tidy later.

## 0 · Pre-check (done tonight, no passkey)

`deploy/vti/vtc/join-criteria.json` was checked member by member against the register payload schema `vtc/schemas/accepts/register/0.2` as published on the Trust Tasks TF repository today (the local clone holds only 0.1, whose `query` requirement no longer applies):

| criterion | admission | invitationRequired | members used | result |
|---|---|---|---|---|
| `invited` | automatic | true | id · admission · invitationRequired · description | OK |
| `work-evidence` | review | absent | id · admission · description | OK |
| `review` | review | absent | id · admission · description | OK |

Schema facts applied: `id` is a trimmed string of 1 to 128 characters; `admission` is `automatic` or `review`; `description` is at most 1,024 characters; `query` and `credentialIssuers` require each other and neither is used; no extra members are allowed and none are present. A criterion that requires nothing goes last, so the order is `invited` · `work-evidence` · `review`. The plugin's `intended-criteria.json` carries the same three with `remove: ["member-credential"]`; it will show the diff against the live manifest once the keeper is signed in.

## 1 · Register the criteria (console · Vetting → Requirements)

1. Sign in to the console at vtc.mages.city with the passkey (single-administrator mode).
2. Vetting → Requirements. Remove `member-credential` (no trust registry chosen; `credentialIssuers=community` would only admit existing members).
3. Add `work-evidence`: admission `review`; description as in `join-criteria.json`. Place it between `invited` and `review`.
4. Confirm `invited` reads admission `automatic` with invitation required, and `review` stays last.
5. Open the keeper's desk plugin (Overview): the criteria panel should read no diff against `intended-criteria.json`.
6. Record the manifest as served (`GET /v1/join-requests/manifest` or the console's view) into `deploy/vti/EDITION.md` stage 2's evidence row, redacted of nothing (the manifest is public).

## 2 · Issue the first invitation (console · Invitations)

1. Invitations → New. Purpose: the first invited member of the City. Note the link or QR the console mints.
2. The invitation is single use and satisfies the `invited` criterion automatically; the City's gate issues one only after VALIDATED understanding and a human countersign, so the countersign is the keeper's own act of pressing Invite.
3. Keep the invitation text out of every repository. The runbook records that one was issued, its purpose and the date, not the token.

## 3 · One synthetic admission, then revocation (EDITION.md stages 3 to 6)

1. A synthetic agent with its own VTA: `cargo install openvtc` → `openvtc setup` → Communities → join with the community DID `did:webvh:QmQ8GMNCTui2H9gjxQWByS1ScsWkByaeQHYnzhcET1UPne:dids.mages.city:vtc`, carrying the invitation from act 2 (or, to exercise `work-evidence`, an evidence root and chronicle instead).
2. Observe **pending**: pending grants nothing. Approve in the console.
3. Verify the membership credential independently with the upstream client: issuer, subject, proof, expiry, status. Try the four negatives (altered proof, wrong subject, expired, revoked): none may grant access.
4. Publish the minimum view on the front (`site/community.json`: `communityDid`, `status: "minted"`, member count only). The front deploys on push; nothing on the front is authoritative.
5. Revoke. Confirm the status-list bit flips and the front follows on the next publish. Retry the publication once: it must not duplicate the admission.
6. Fill the EDITION.md table (stages 3 to 6) with versions, the synthetic identity, expected and observed results and redacted failures. Only then write a release lock into `edition.json`.

## What the acts change elsewhere (the reflection lane's follow-ups, after the keeper acts)

- `cityofmages/mages-city/DISCOVERY.json` door `community→join` gains `criteria: registered` and the date.
- The guide's City door and Boards page already say "once the keeper registers them"; one word changes.
- The labs `/harness/record/` and the spellweb `gateway-join-mages-city` node carry the criteria as registered.
- The Arena draws the wave (reflection plan §2.6) only after the first `work-evidence` admission exists to point at.

## What never leaves the keeper's hands

The passkey, the invitation token, the console key, the VTA mnemonic backup. None of these is written anywhere a reflection reads.

## 4 · Publish the two wallet sign-in services and the MyTerms service (VTA · pnm on the node)

Added 20 Oct afternoon. The City's DID document (version of 9 Oct) lists no `TrustTaskHTTPS` and no `SignInPortal`, so a Star Key wallet joining by the City's DID stops at `join/no-service` with nothing sent — the same wall The First VTC has. The new document is staged on the node at `~/vtc-doc-2026-10-20.json` (the published document plus three services):

```
TrustTaskHTTPS  https://vtc.mages.city/v1
SignInPortal    https://join.mages.city/members/
MyTerms         https://join.mages.city/myterms/configuration.json
```

1. On the node, as `privacymage`:
   `pnm --transport rest did-mgmt dids edit --did did:webvh:QmQ8GMNCTui2H9gjxQWByS1ScsWkByaeQHYnzhcET1UPne:dids.mages.city:vtc --document ~/vtc-doc-2026-10-20.json --label "wallet sign-in + MyTerms services" --no-confirm`
2. Check `https://dids.mages.city/vtc/did.jsonl` has a third entry naming the three services. If it still shows two (the 0.8.3 DID host cannot unpack the new VTA's push — KEEPER_ACTIONS gotcha of 9 Oct), upload the log by hand: `pnm did-mgmt dids get-log <did>` → manager → Upload DID Log, then restart `vti-dids`.
3. `vtc status` on the node should report both sign-in services present once vtc-service is at 0.12.0 (the self-check landed there; 0.11.58 does not run it).

## 5 · Serve the City's MyTerms configuration (website, live mode) and the desk card

The keeper's desk plugin gained a **Your terms** card (accepted codes from its local `myterms-configuration.json`, a check of the published DID document for the `MyTerms`, `TrustTaskHTTPS` and `SignInPortal` services, and the agreements received inside join requests where the build serves a REST listing to plugins — 0.11.58 does not, so it links to the console page). Put it on the node with `wsl -d mages-core -u root -- bash /mnt/c/Users/mitch/mages_city/deploy/vti/vtc/bin/sync-console.sh`, then Reload plugins in the console.


Copy `deploy/vti/vtc/website/.well-known/myterms-configuration`, `myterms/configuration.json`, `myterms/agreements.json` and `myterms/index.html` into `~/vti/vtc/website/` on the node (live mode, 5 s cache). Then `curl https://join.mages.city/myterms/configuration.json` must return the JSON. The City accepts `SD-BASE-DP` and `SD-BASE`, counter-offer `SD-BASE-DP`. A Star Key wallet (join-by-DID with MyTerms, built 20 Oct) then shows the agreement on the "Ask to join" screen, sends it inside the signed request as `extensions["org.agentprivacy.myterms"]`, and keeps the record.

Also copy `members/index.html` (added 21 Oct, after the publish): the published document's `SignInPortal` is `https://join.mages.city/members/`, which the wallet uses as an origin and as the "Open the member page" door after admission; vtc-service 0.11.58 in strict host mode serves no portal there, so the template carries a landing page that says what is true (sign in from the wallet or the console; the portal arrives with vtc 0.12).

## 6 · The DID host upgrade (Option B) · PERFORMED 20 Oct 22:50 → 23:55 BST

What the keeper and the lane did, in the order it actually went, so the next operator does not repeat the detours. The host's own DID changed; the three hosted DIDs did not.

1. **Snapshot and stop.** `~/vti/rollback/20261020-dids/` = copy of `~/vti/dids`, the 0.8.3 binary, `did-hosting-daemon backup` (v2 bundle). `systemctl stop vti-dids`.
2. **New binary** (download channel "latest", sha256 `1c99e75e…`, still prints 0.8.3 but carries `tsp-relationship-*` commands = it reads the current VTA's TSP frames). Old dir moved to `~/vti/dids.0.8.3`; fresh `~/vti/dids`.
3. **Detour 1 — nothing resolves while the host is down.** The VTA's own DID lives on this host, so with it stopped the VTA could not re-authenticate to the mediator (`HTTP 502` on `/vta/did.jsonl`) and dropped its websocket; every `pnm` call over TSP timed out. Fix: serve the old logs for the duration with the rollback binary (`cd ~/vti/dids.0.8.3 && nohup ~/vti/rollback/20261020-dids/did-hosting-daemon.old --config config.toml &`) and `systemctl restart vti-vta`. Export the three logs while they resolve (`curl https://dids.mages.city/{mediator,vta,vtc}/did.jsonl > ~/vti/tmp/<name>.jsonl`).
4. **Detour 2 — the timed-out `pnm contexts create` half-worked.** It created `webvh2` (index 6) but the admin grant for the setup key never landed. `pnm acl create --did <setup did:key> --role admin --contexts webvh2 --expires 1h --handoff` is the equivalent grant.
5. `pnm did-mgmt servers delete did-hosting-daemon` so the VTA has no broken TSP target during provisioning (the 8 Oct state).
6. **Detour 3 — the interactive wizard no longer asks "plaintext secrets?"** It provisioned through the VTA (DID `QmNWkT…`, admin rolled to `z6Mko22…`) and then refused to write clear-text keys, discarding the bundle; the setup key was already consumed by the hand-off. Fix: a **recipe** (`core-node/did-hosting-daemon.recipe.toml`, copied to `~/vti/dids/recipe.toml`) with `[secrets] backend = "plaintext"`, `confirm_plaintext = true`; a second setup key (`setup --setup-key-out … --context webvh2`), a second grant, then `setup --from recipe.toml --setup-key-file …` ran straight through: host DID `did:webvh:QmQrSN8iu7VYW5QdvBt675qkQR6yWuEaL9xwsAox8WSmY8:dids.mages.city`, admin `did:key:z6Mkpwj3BRMa67M8b2XxaLmaoyq7fTg1B888Wt329Lc2zARM`, config.toml + `config.secrets.plaintext` (0600) written, VTA added to the host ACL.
7. `pkill -f did-hosting-daemon.old`; `did-hosting-daemon invite --role admin --did <admin did:key>`; `systemctl start vti-dids`; passkey enrolled; `mediator`, `vta`, `vtc` logs pasted in at `https://dids.mages.city/dids` (mediator first: the host's own messaging waits on it); `systemctl restart vti-vta`.
8. `pnm did-mgmt servers add --id did-hosting-daemon --did <host DID> --label dids.mages.city`; `pnm health` healthy.
9. **Detour 4 — "admin takeover requires force=true".** TSP now worked both ways (the host accepted the VTA's relationship invite, bidirectional), but the host refused the VTA's `atomic-register` of `vtc` because a log pasted in by hand is owned by the passkey admin, not the VTA; the VTA reported it as `bad gateway … retry`. Fix in the manager: `vtc` → **Transfer Ownership** → the VTA DID (the new owner must already be in the host ACL; setup put it there).
10. `pnm did-mgmt dids edit --did <vtc> --document ~/vtc-doc-2026-10-20.json --label "wallet sign-in + MyTerms services" --no-confirm` → version 3 published; the unconfirmed head 2 of 9 Oct was reconciled on the way.

Left behind, harmless, tidy when convenient (pnm, keeper): the failed run's DID `did:webvh:QmNWkTStybtnGHJP9u8tqkLHLEogiNAxG99XDHirQCwieG:dids.mages.city` (what `pnm contexts list` still shows for `webvh2`) and its admin ACL entry `did:key:z6Mko22wiXBCdsWd9CbkWKdTZDtt67ffQ6ygoyxUngSL9DiV`; the old context `webvh` with the retired host DID `QmWW65…`; `~/vti/dids.0.8.3` and the rollback dir. `~/vti/BINARIES.sha256` now pins the new daemon (no longer "held"). Rollback, should it ever be needed: stop `vti-dids`, reinstall `~/vti/rollback/20261020-dids/did-hosting-daemon.old`, swap the directories back, `servers delete` + `servers add --did <QmWW65…>`, and transfer `vtc` back.
