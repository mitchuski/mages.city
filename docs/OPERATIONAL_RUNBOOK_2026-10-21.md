# Operational runbook · 2026-10-21 · from "published" to "people join"

Written after the night of 20 October, when the DID host was upgraded and the City's DID document went to version 3 (`KEEPER_ACTS_2026-10-20.md` §6). This is the order of work from here, in four parts: the First VTC (the OpenVTC reference community and the First Person farm), Mages City, MyTerms, and the Star Key browser wallet. Each step says who does it (K = keeper at a keyboard or browser, L = the lane from its own tools), where it is typed, and what "done" looks like. Nothing in it is secret.

Where things stand at the start (checked 21 Oct 00:10 BST):

| thing | state |
|---|---|
| City DID document | version 3 live: TSPTransport · DIDCommMessaging · VTCRest · VTCStatusList · **TrustTaskHTTPS** `vtc.mages.city/v1` · **SignInPortal** `join.mages.city/members/` · **MyTerms** `join.mages.city/myterms/configuration.json` |
| DID host | new build, host DID `did:webvh:QmQrSN8…:dids.mages.city`, TSP with the VTA both ways, `vtc` path owned by the VTA |
| VTC service | 0.11.58, strict host mode (api/console on vtc., website on join.); serves `vtc/join-requests/{manifest,submit,…}` over `POST /v1/trust-tasks`; no member portal in this build |
| Members | one real: `february-sphere` (First Person farm persona, 19 Oct) |
| Wallet core vs the document | `selectSignInServices` → portal origin `https://join.mages.city`, Trust-Task endpoint `https://vtc.mages.city/v1/trust-tasks`; MyTerms endpoint read |
| 404s the document still points at | `/members/` and `/myterms/configuration.json` on join.mages.city — files written in the repo, not yet copied to the node |
| First VTC document | no `SignInPortal`, no `TrustTaskHTTPS` → wallet join impossible until its operators publish them; agent join (openvtc) possible |

---

## Part 1 · The First VTC, both directions

The "First Person sense" is two flows: a City mage joins **their** community (first.openvtc.net), and agents from **their** farm join ours (that already happened once).

### 1.1 Our agent joins The First VTC (K, node) — **SENT 21 Oct 01:35 BST, Pending**

Done as written below: persona `did:webvh:QmRYnVZAoPZ1eAyxaXPShqBUu8S3bCbPanm42ymDJMnQR8:dids.mages.city:safe-model` in context `openvtc/qme5theer1qr`, open request over TSP, registry publication consented. Watch: TUI → Communities (Pending → admitted/declined). Also learned: the node distro stops when nothing is attached; the keep-alive task was re-run (sleeper PID in the distro) — see 2.8.

Why it failed at 15:54 on 20 Oct: the TUI asked the City's VTA to mint a persona DID, the VTA pushed it to the DID host over TSP, and the 0.8.3 host could not read the frame. The host is replaced; this path is what tonight's work opened.

1. On the node: `OPENVTC_SECURE_STORE=file openvtc` (the profile from 20 Oct is at `~/.config/openvtc/config.json`; the long-term admin `did:key:z6MkmqWS…gqj` is scoped to context `openvtc`, persona-holder).
2. **Join a community** → paste `did:webvh:Qme5ThEEr1qRLRHYMrcrmjecG3znC8FBPEoswuSjebFkhx:webvh.storm.ws:first-vtc`.
3. Choose **Send an open request** (their `review`/moderators path). Not "Apply for vetting as a new persona" — that asks their vetters to vouch for someone they have never met.
4. The TUI creates persona `openvtc/mage` (it may already exist from the frozen attempt; if it offers to reuse it, yes) and mints its DID through the VTA → DID host. Watch for the DID: `did:webvh:<scid>:dids.mages.city:mage` or similar. Done when the TUI shows the request **pending** with a request id.
5. If it fails again: paste the TUI text; the lane reads `journalctl -u vti-vta` and `-u vti-dids` for the same minute. The two failure shapes we know are both fixed (TSP frame; admin takeover of a hand-pasted path — the persona's path is new, so ownership is the VTA's from the start).
6. Wait for their moderators. Status: TUI → Communities → the request. When admitted, the persona holds a VMC from The First VTC; the City's "value loop" page (found/become) can then say it truthfully.

### 1.2 Their members join the City (already proven once; make it repeatable)

- The Agent door works end to end: `openvtc` on their side → `vtc/join-requests/submit/0.3` over DIDComm → `review` → the keeper decides in the console. Nothing to build.
- Make the decision faster: **act 1** of `KEEPER_ACTS_2026-10-20.md` (criteria `invited · work-evidence · review`, remove `member-credential`) and **act 2** (first invitation). Both are console clicks (K). Done when the desk card shows no diff against `intended-criteria.json`.

### 1.3 Ask First VTC's operators for the wallet door (K, a message)

Their document lacks the two services every wallet needs. Only they can publish them (`pnm did-mgmt dids edit` on their VTA, and `cnm did-log install` if they self-serve). The paragraph to send, wherever you talk to them (DTG channel, or a VTI issue):

> The First VTC's DID document lists VTCRest but no `TrustTaskHTTPS` and no `SignInPortal`, so a browser wallet joining by the community DID stops before it sends anything (the wallet needs both; VTI added them 10–11 Oct, vtc-service 0.12 self-checks for them). Could the document be republished with `TrustTaskHTTPS https://first.openvtc.net/v1` and a `SignInPortal` URL (your `/members/` page works)? Mages City republished its own tonight and the wallet path opened.

Done when `https://webvh.storm.ws/first-vtc/did.jsonl` (or wherever their log is served) lists both; the lane will check on request.

---

## Part 2 · Mages City, from the document to a second member

### 2.1 Make the named pages answer (K, node, 1 minute) — **DONE 21 Oct 01:40 BST** (plus `chmod 644` on files copied from `/mnt/c`: vtc refuses the execute bit; dot-paths are never served, so `/myterms/configuration.json` is canonical). 2.2 synced the same minute; Reload plugins is the keeper's click.

```
cp -r /mnt/c/Users/mitch/mages_city/deploy/vti/vtc/website/{.well-known,myterms,members} ~/vti/vtc/website/
curl -s https://join.mages.city/myterms/configuration.json | head -c 120; echo
curl -s -o /dev/null -w "%{http_code}\n" https://join.mages.city/members/
```

Done when the first prints JSON beginning `{"version"` (or the file's first bytes) and the second prints 200. Live mode, 5 s cache, no restart. The `members/index.html` is a landing page: it says sign in from the wallet or the console, portal arrives with vtc 0.12. The homepage hides its own members link (`memberPortal: false`); flip that to true in `community.config.json` once the page is up, since the door now exists.

### 2.2 The keeper's desk card (K, Windows terminal)

`wsl -d mages-core -u root -- bash /mnt/c/Users/mitch/mages_city/deploy/vti/vtc/bin/sync-console.sh` → console → Reload plugins. Done when the Overview shows the **Your terms** card reading the three services from the published document as present.

### 2.3 Criteria and the first invitation (K, console) — acts 1 and 2

As written in `KEEPER_ACTS_2026-10-20.md` §1 and §2. Done when Vetting → Requirements reads `invited (automatic, invitation required) · work-evidence (review) · review (review)` and one invitation exists (token kept out of every file).

### 2.4 A wallet join against the City (K in Chrome, L watches)

1. Reload Star Key (loaded from `~/star-key/packages/extension/dist`, a junction to the current build), unlock.
2. Press 🤝 in the Star header → paste `did:webvh:QmQ8GMNCTui2H9gjxQWByS1ScsWkByaeQHYnzhcET1UPne:dids.mages.city:vtc` → Join.
3. Expected screen: the community's name and host, the join manifest's criteria, and **Your terms** showing `SD-BASE-DP — …` with the checkbox on (from 2.1). "Ask to join".
4. The request goes to `vtc.mages.city/v1/trust-tasks`; the wallet shows **pending**; the console shows a join request under `review` carrying `extensions.org.agentprivacy.myterms`.
5. Keeper decides in the console. The wallet shows **admitted** and offers "Open the member page" → the landing page from 2.1.
6. Manager → Data & credentials → **Your terms**: one record (code, agreement id, request id, effect `allow`, two digests).

If step 2 fails, the wallet names the stage (`join/did-unverified`, `join/no-service`, `join-manifest`, `join-submit`); paste it. `join/no-service` can no longer happen for the City.

Expect one browser prompt at "See what it asks": the wallet asks to reach `join.mages.city` and `vtc.mages.city` together (it holds no site permission by default, and without one CORS refuses its fetches; the City's website cannot add CORS headers). Allow it. A wallet that already allowed `vtc.mages.city` on 9 Oct still needs `join.mages.city` for the terms configuration.

Who is the applicant? The wallet signs as a persona of the identity it manages; for a first test that is the City's own VTA (the keeper joining the keeper's community), which is fine as a smoke test and should then be **revoked** (2.5). A real second member is a different person's wallet or an agent on another farm.

### 2.5 Revocation and the record (K console, L repo) — act 3 of EDITION.md

Revoke the smoke-test membership; confirm the status-list bit flips (`/v1/status-lists`) and the front's member count follows on the next publish. Fill `deploy/vti/EDITION.md` stages 3–6 with the versions, the identity, expected/observed. Then `edition.json` gets a release lock.

### 2.6 Tidy (K, pnm, whenever)

`pnm acl delete --did did:key:z6Mko22wiXBCdsWd9CbkWKdTZDtt67ffQ6ygoyxUngSL9DiV` (the failed run's admin); the stray DID `QmNWkT…` in context `webvh2`; later, `~/vti/dids.0.8.3` and the 20 Oct rollback dir once a week has passed.

### 2.8 Keep the node up (K, Windows) — found 21 Oct 00:08–01:32

The `mages-core` distro halts when no Windows process is attached; the services only run while a shell or the keep-alive sleeper holds it. The 19 Oct sleeper had died (a WSL shutdown kills it; the task fires only at logon), so between the lane's checks join.mages.city was off. Re-armed with `schtasks /Run /TN "mages-core keep-alive"`. Hardening to do: make the task's action a loop that re-launches `sleep infinity` when it exits, and add a trigger on WSL start (or `wsl --exec` from a tiny service). Check: `wsl -d mages-core -u privacymage -- pgrep -af "sleep infinity"` prints a PID.

### 2.7 When vtc 0.12 reaches the download channel (K)

`core-node/update-binaries.sh` (snapshot + rollback) → the member portal appears at `/members/` on the website host; remove the landing page; `vtc status` self-checks the two sign-in services. Watch for the strict-host-mode rule (a filesystem website on the API origin makes vtc refuse to start).

---

## Part 3 · MyTerms, operational and proposed

What is built (20 Oct): the Customer Commons roster mirrored in the wallet core; the City publishes `myterms/configuration.json` (accepts `SD-BASE-DP`, `SD-BASE`; counter-offer `SD-BASE-DP`); the wallet reads it from the `MyTerms` service, plans one round (your standing code if accepted, else the counter-offer), builds the agreement record (VCA), sends it inside the standard `vtc/join-requests/submit` as `extensions["org.agentprivacy.myterms"]` (profile `mcnp-draft-01/vtc-join/1`), and keeps a record with the digests of the signed request and the signed verdict. No conformance claim anywhere.

### 3.1 Operational (follows Part 2)

- 2.1 serves the configuration; 2.4 produces the first real record; the console shows the extension inside the join request. **Done when one admitted request on the City carries the agreement and the wallet's pane shows it.**
- The desk card's "agreements received" column links to the console's join-requests page (0.11.58 has no plugin-side listing); with vtc 0.12 the card can read `join-requests/list` and show the code per request.
- Open design items to settle before proposing: the community does not counter-sign the VCA separately (bilateral evidence = the signed request threaded with the signed verdict); P4 **audit export** (a wallet "export my agreements" file) is not built; the `.well-known/myterms-configuration` path is served but the DID service points at `/myterms/configuration.json` (choose one as canonical in the proposal; IEEE 7012's draft favours `.well-known`).

### 3.2 Propose (L drafts, K posts) — three doors, in order

1. **Trust Tasks TF** (your lane): a profile for `vtc/join-requests/submit`, "terms proffered at the door": the extension key, the VCA shape, the one-round rule, what the verdict document must echo. Evidence: the City's first record. Voice: plain, no names, as the TF threads go.
2. **VTI / OpenVTC** (feature issue on vtc-service + the browser plugin): community publishes a MyTerms configuration and advertises a `MyTerms` service; the join manifest carries the accepted codes; the console shows the agreed code per member; the plugin's "Your terms" screen. Point at the star-key fork's commits as a working reference once pushed.
3. **Customer Commons / IEEE P7012**: a short note, "a VTC-join profile of MyTerms, running", with the roster mirror and the no-mint rule stated. You are in the group; this is the convergence to show.

Done when the three are posted and their links are in `docs/OPENVTC_WORKSTREAM_2026-10-19.md` §5.

---

## Part 4 · Star Key, the browser wallet

### 4.1 Now (K): verify, then commit

- The build loop: `cd ~/star-key && npm run build` → chrome://extensions → Reload (never Remove: it wipes wallet storage). Tests: 1324/1324 extension, 1071 core.
- Run 2.4. Then check the three places the work lives: the 🤝 window (paste, read the page's QR, camera, image drop), the join screen's "Your terms", the manager's "Your terms" pane.
- Commit in `~/star-key`: the upstream merge (77 commits, README kept ours) and the feature work, as you prefer (one merge commit + one feature commit reads cleanest). Nothing is pushed until you say.

### 4.2 Next for others to use it

- Newcomers cannot "load dist": the repo ships no build. Choose: a release zip on GitHub (fast), or the Chrome Web Store (review time, but the real door). Either way `starkey.md` on the City front changes from "load dist" to the chosen door.
- Options page: the "Prefer TSP transport" switch is the documented workaround if a VTA cannot read the wallet's TSP frames; the City's VTA (0.56.0) reads them.
- Upstream candidates from the fork, once the City has run them: join by DID (the 🤝 window) and the terms screen. Offer them as PRs to `OpenVTC/vta-browser-plugin` with the City as the live example.

---

## The short order of work

1. Part 2.1 (copy the files) — one minute, unlocks everything the document promises.
2. Part 1.1 (openvtc open request to The First VTC) — ten minutes, the test of tonight's fix from the agent side.
3. Part 2.4 (wallet join against the City) — the test from the human side, and the first MyTerms record.
4. Part 2.3 (criteria + invitation) and 2.5 (revoke the smoke test, write the record).
5. Part 1.3 (the message to First VTC's operators) and Part 4.1 (commit).
6. Part 3.2 (the three proposals), with the first record as evidence.
