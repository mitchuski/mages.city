# The member door and the agreements menu · plan · 2026-10-21

Mitch, 21 Oct ~01:50, after the City's DID document went live and the first wallet join stopped at "already a member":

> the members page should change once you are in the VTA … a button appears like *enter the door* and that gives you that unique member page to manage your DID … with MyTerms, this is going to be one of many trust tasks, you will want to be able to turn on and off with your VTC and have proofs for eventually which you encode into the Star … allow a menu of all the 'agreements' you may have with communities and their websites using this browser extension. MyTerms is not within OpenVTC, but I plan on having it as a sample implementation and leading to a contribution.

Two things, one principle. **The door** is the page a community's DID document names as its `SignInPortal`, and today it is a landing. **The agreements menu** is the wallet's view of every standing it has with a community or a site, of which the MyTerms record is the first kind. The principle, from the wallet's own rules: a page is a verifier and is shown views, never keys or raw replies; the wallet decides, the community decides, the page draws.

## 1 · The member door (join.mages.city/members/)

### What exists

- The DID document names `https://join.mages.city/members/` as `SignInPortal`; the wallet treats that origin as the community's portal (origin compared exactly) and sends the community's requests to `TrustTaskHTTPS` (`vtc.mages.city/v1`).
- The page is a static landing (website template, copied 21 Oct). vtc-service 0.11.58 serves no portal; 0.12 ships one at `/members/` (upstream's: credential, relationships, rooms).
- The wallet injects `window.vtaWallet` on origins the person has granted; a portal page can start sign-in (the trigger-link / page sign-in flows), ask for views of rooms (`rooms.*`, P7b), accept room offers, and ask the wallet to sign or request `vtc/*` trust tasks within `page-task-policy` (never `persona/`, `rooms/` raw, `messaging/`, seeds).
- The City already has the names ladder (`gate/names.mjs`, dry-run; rung 1 admitted → TXT, rung 2 vouched → records, rung 3 witnessed → own `<name>.mages.city` zone) and the κ evidence shapes.

### The door, in three states of the same page

| visitor | the page shows | how it knows |
|---|---|---|
| no wallet | what it says now: sign in from a wallet or the console; the portal arrives with vtc 0.12 | `window.vtaWallet` absent |
| wallet, not a member | **Ask to join** (opens the wallet's join flow for this community DID, the same 🤝 path) and the terms the City takes (reads `/myterms/configuration.json`) | `vtaWallet` present; sign-in refused as not a member |
| wallet, member | **Enter the door** → the member page | page-initiated sign-in succeeds; the wallet returns the member's persona DID for this community (it is the vault entry the "already a member" check reads) |

### The member page (behind the door)

Everything on it is either a wallet view or a signed `vtc/*` read the wallet performs as the member:

1. **Standing**: the membership credential (issuer, issued, expiry, status-list bit live), via `vtc/members/show` requested through the wallet. Revoked reads as revoked; nothing cached.
2. **Your DID here**: the persona the member joined as, its log (`dids.mages.city/<path>/did.jsonl` if City-hosted, or wherever), rotation (`vtc/members/rotate-challenge` + `rotate`, both in 0.11.58) — rotate from the wallet, the page only offers the button.
3. **Your name in the City** (the names ladder, rung by rung): rung 1 unlocked by the VMC → claim `<name>` (a TXT marker via the broker); rung 2 after vouches → records; rung 3 after a witnessed seal → the `<name>.mages.city` subtree. Evidence comes from the VTC (`gate/vtc-evidence.mjs`, already written against VTC routes) and the κ ledger; the page shows the rung and the next requirement. "Manage your keeper" = this: the member's own subdomain and what it is allowed to publish.
4. **Agreements with this community**: the MyTerms code agreed at the door, the request/verdict digests, and a per-community switch (see §2). Later: endorsements held, rooms (upstream's portal already draws rooms via `rooms.list`).
5. **Leave** (withdraw / ask for revocation), one confirmed action.

### Build path

**D1 BUILT 21 Oct 04:00 BST** (Mitch: "join.mages.city doesn't update once we are members — how do we do this, or add a secret page that redirects members"). Wallet: `window.vtaWallet.membership.status({hostDid})` — a new page method behind the same gate as the directory (the page's browser-attested origin must be the origin of `hostDid`'s verified `SignInPortal`; the directory offscreen ops `portal` and `members` are reused), answering a view from the wallet's own record: the identities it signs in with at that community and the standing agreement (code, status, date); never a credential or a signature; no prompt (`membership-page.ts`, 4 gate tests, ext 1340 green, dist 02:59). Website: `/members/` is the door — it reads the community DID live from `/health`, waits for the wallet (`vtawallet:ready` or 1.5 s), asks it, and sends a member on to **`/members/home/`**, the page behind the door (how you are known here · the terms you joined under · rooms shared with this page · what is not here yet); a non-member sees "Ask to join" with the DID to copy for the 🤝; a visitor without a wallet sees the landing; the home page bounces anyone the wallet does not know back to the door. Both live on the node (`members.js`; Cloudflare caches the script ~4 h, so a changed copy needs a purge or waits). Not in D1: a page-initiated join (the wallet's 🤝 is the join door), rotation, names.

- **D1 (now, static + wallet):** the three-state page in the website template: detect the wallet, offer Ask to join / Enter the door, render standing and the agreement from wallet views. Needs two small wallet additions: a page method that answers *am I a member here, and as whom* for the portal origin only (a view: persona DID, since, code agreed; never the credential), and the join flow callable from the portal page (it already is from the 🤝 window). Server side: nothing; `vtc/members/show` is a signed read the wallet can already request.
- **D2 (when vtc 0.12 lands):** upstream's portal replaces the landing at the same URL; our page becomes the City's *skin* over it (keeper's desk plugin pattern, `admin_ui.plugin_dir` has a member-side sibling or we propose one).
- **D3 (names):** wire the broker (`gate/names.mjs` + `dns-cloudflare.mjs`) to the VTC evidence live; the page's rung display reads the ledger. This is the "unique member page … manage your keeper" piece and it already has tests, dry-run only.

## 2 · Agreements: one family, MyTerms first

Mitch, 02:40, two rulings that fix the frame:

> MyTerms is on top of membership: it's a catalogue of all the privacy terms you have with websites you visit.

> Doing that key ceremony with sites using your VTA Star Key is like collecting nodes in your VTA's runtime history.

So the catalogue is not a list of join records. It is every term the person holds with any site they visit; a community's join door is the first place one is made, and a website with no community can take terms through its own MyTerms configuration and agreements endpoint (the MCNP draft's flow). Each agreement made is a node in the agent's history: an evidence pair the Star can later carry. Consequences built 21 Oct 02:30–03:10 (star-key, uncommitted): `Agreement.counterparty` is a DID or a site origin and `Agreement.via` says `join-request` or `site`; the 🤝 window on any page shows the agreements already held with that site (and with a DID typed in), reads the site's own MyTerms configuration when the wallet may reach it (`/.well-known/myterms-configuration`, then `/myterms/configuration.json`), compares it with the standing agreement, and offers "Allow and read its terms" when the wallet has no permission for the site yet. Not built: proffering terms to a plain website (the `via: "site"` ceremony: POST the agreement to the site's agreements endpoint, signed by the holder; the site's signed answer is the other half).

Two facts found on the way, both load-bearing: **(1)** the wallet holds no host permission by default, so any fetch from it to a community or site is refused by CORS unless the person has allowed that origin — the join window now asks for the portal and the Trust-Task endpoint together, first in the click, before it fetches anything; **(2)** the City's VTC website cannot add response headers (no CORS allow-origin on the configuration), so permission is the way, not headers. The First VTC's `/.well-known/myterms-configuration` answers 200 with its homepage (a single-page fallback), not a configuration; vtc-service 0.11.58 knows nothing of MyTerms.

**04:25 — the 🤝 window drawn, not said** (Mitch: "less language, more just connecting a star and the handshake coming together … is it finding its manifold?"). `handshake-figure.tsx`: the wallet's Star on the left (the same solid as the header and Setup; its core lights when an agreement stands), the site's mark on the right, and between them the manifold — a ring that is open while nothing is agreed, closes as the site takes one of the person's offers, and holds closed once an agreement stands, the 🤝 at the join. Four states: apart · none · offered · agreed. The words under it are one line, plus "With <site>: …" and a folded "What this does". Yes, that is the figure finding its manifold: on the City's map a node is the Star inside its shell rings, and an agreement is the first ring a visitor's Star closes with another party — the edge the Star can later carry as a leaf.

### The shape

An **agreement** is a standing between an identity the wallet holds and a counterparty (a community, or a website that is a community's portal), reached through a trust task, with evidence on both sides. The MyTerms record (`myterms-records:<vtaDid>`) is one kind. Generalise, do not multiply stores:

```
Agreement {
  id, kind: "myterms" | …,          // the task family that made it
  holder: persona DID,              // who agreed, on the wallet's side
  counterparty: community DID,      // who it is with
  site?: portal origin,             // where it was reached, if a page was involved
  terms: { code, url, title },      // what was agreed (kind-specific)
  reached: { requestId, requestDigest, replyDigest, at },   // the evidence pair
  status: "proffered" | "agreed" | "declined" | "withdrawn" | "superseded",
  enabled: boolean                  // the wallet's switch for this counterparty
}
```

Two switches, deliberately not one:

- **Wallet side, per counterparty** (`enabled`): "I proffer my terms to this community" — on by default where the community takes terms; off means the wallet sends no agreement and the community's door decides what that means (the City: the counter-offer is the floor, so an applicant who sends nothing is treated as proffering nothing and the City proposes SD-BASE-DP; a stricter community may refuse).
- **Community side** (the VTC's configuration, keeper's console): "this community takes terms" with the accepted roster and the counter-offer. On the City this is `myterms/configuration.json` plus the desk card; the switch is editing that file today and a console toggle when the VTC learns the family (contribution).

### The menu (wallet)

Replace the **Your terms** pane with **Agreements** (Data & credentials): one row per agreement, grouped by counterparty, with the site, the code, the status and the switch; the detail shows the digests, the request id and the reached time. Filters: kind, community, status. Empty state names the first kind so nobody wonders what an agreement is. The settings' standing code stays in Options (it is the holder's default, not a per-community thing).

### Proofs into the Star (later, stated now so the record is built for it)

An agreement's `reached` pair is already two digests of two signed documents. That is exactly the shape of a κ leaf (`kappa_evidence_mage`): the Star's lattice reading can carry *that an agreement exists with a counterparty* at D4/D3/D2 — the code publicly, the counterparty hashed, the digests held — so a member can show a verifier "I hold SD-BASE-DP agreements with three communities" without naming them, and name one on request. Nothing to build until the menu exists; the record keeps the digests so nothing has to be recomputed.

### Trust-task family (the contribution)

MyTerms rides today inside `vtc/join-requests/submit` as `extensions["org.agentprivacy.myterms"]`. The family it samples:

| task | who sends | what |
|---|---|---|
| `agreements/offer` | holder → community | proffer terms (a roster code or a URL + digest) under a profile |
| `agreements/decide` | community → holder | accept / counter / decline, threaded to the offer |
| `agreements/list` | holder → community | what stands between us |
| `agreements/withdraw` | either | end it, with reason |

The join-door case is `offer` carried inside the join request and `decide` threaded in the verdict — which is what is built. The sample implementation is the City + the Star Key fork; the proposal goes to the Trust Tasks TF as a profile first (the TF is where task families are named), then to VTI as a vtc-service feature with the console switch, then Customer Commons / IEEE P7012 as "a VTC profile of MyTerms, running". The MyTerms plan (`MYTERMS_PLAN_2026-10-20.md` in star-key) keeps its deviations list; this file is the generalisation.

## 3 · Order and sizes

1. **Agreements pane + store generalisation** — **BUILT 21 Oct 02:30 BST** (star-key, uncommitted): core `vtc/agreements.ts` (`Agreement`, `AgreementPreference`, `agreementFromTerms`, `isAgreement`, `standingAgreements`, `statusOfEffect`); extension `agreements-store.ts` (`agreements:<vtaDid>`, `agreement-prefs:<vtaDid>`); console pane **Agreements** (standing choice · switch per community with "add a community DID before you knock" · filters by standing and community · table with both digests) replacing "Your terms"; join flow dep `termsEnabled` → the offered view carries `enabled`, the join screen's box defaults to it (a default, never a refusal). No migration from `myterms-records` (nothing deployed; the one wallet held no records). Tests: core 1077, extension 1328, all green; dist rebuilt. **Then 03:10:** the 🤝 window became the catalogue's door (agreements with the site, the site's own terms, the standing comparison, the allow-and-read step) and the join window gained the host-permission step; extension 1334 green, dist rebuilt. Next inside this item: the `via: "site"` ceremony with a plain website. **03:50:** Mitch: "the agreements page still needs some work; selecting and sharing the standing agreements you want to present at the door is a choice you can make in the extension" → the standing choice became an **ordered set of offers** (`myTermsOffers`, chosen with one `TermsChooser` in both the Agreements pane and Options; `planTerms` takes the first the community accepts), each community's card gained a **pick** ("present here first", `AgreementPreference.offer`, ahead of the order) beside its switch, and the pane was rebuilt as what-you-present · a card per community (standing, switch, pick, add-by-DID) · history behind a toggle (filters, digests, how it was made). Ext 1336 green, dist rebuilt. **City side:** "we do no tracking of third parties, can be one of the first to say as such, and are part of the MyTerms alliance" → `join.mages.city/myterms/` now carries "What the City promises" (no third-party tracking; member of the MyTerms alliance — Mitch to confirm the alliance's exact name before the front deploys), the configuration's `notes` say the same (live on the node), and the **apex** gained `site/.well-known/myterms-configuration` + `site/_headers` (CORS `*` on that path, which Workers assets honour) so mages.city itself is a site that takes terms, readable by any wallet — the first `via: "site"` counterparty once that ceremony is built. Deploys on push (Mitch).
2. **Door D1** (City website + two wallet page methods; a day): the three-state page, the membership view, the join from the page.
3. **Proposal texts** (an evening): TF profile, VTI feature issue, Customer Commons note — with the first real agreement as evidence (needs a non-member wallet: a second Chrome profile, or the first outside member).
4. **Names D3** (two days, needs a Cloudflare token scoped to DNS edit): the rung display and the broker live.
5. **Star encoding** (after the kappa lane's leaf shape is settled): agreements as leaves.

What is deliberately not in this plan: a page ever seeing a credential or a key (views only); a wallet-wide "agreements on/off" (it is per counterparty or it is meaningless); claiming IEEE 7012 conformance anywhere before the group says so.

### 14:58 — a way to get the wallet

There was no link anywhere in the City that handed a visitor the extension: the Star Key page sent people to the repo and told them to load `packages/extension/dist`, which is gitignored, and the members door said "with a Star Key wallet" and nothing of where one comes from. Now:

- `site/get-star-key.md` — the install page. States the lineage (agentprivacy's fork of OpenVTC's `vta-browser-plugin`, source at `mitchuski/star-key`), gives the download two ways (City-served `site/downloads/star-key-0.2.0.zip`, and the GitHub release on the fork, same file), the SHA-256 (`fd553854…ef52`), the load-unpacked steps, and the hand-off to `starkey.md` for connecting to one's own agent.
- The zip is the package script's output (`npm run package` in `packages/extension`, manifest at the archive root, `key` omitted), built from the 03:24 dist, 1,696,816 bytes.
- Linked from `starkey.md` (first bullet now names the fork and the install page), `join.html` step 01 ("Get Star Key →"), and the members door's no-wallet state on the node (copied, 644, live).
- Mitch: create the GitHub release on `mitchuski/star-key` (tag `v0.2.0`), attach `packages/extension/release/vta-wallet-0.2.0.zip` renamed `star-key-0.2.0.zip` so the two addresses carry one file; push the front so the City copy and the page go live. No Web Store listing for the fork: that is the upstream publisher's act (Affinidi for OpenVTC's wallet); the fork is loaded unpacked.
- `bin/verify.mjs` needs the local front on :3334 and was not running; the check is environmental, not a page failure.

### 15:30 — the Star and the Hold, checked against the pages

Review question: is the City using and directing people to the fork's Star and Hold, and the byte reductions they make? Findings:

- The wallet does route to them: the header's 📤 (star.html, read a City Key: name · palette · optional lit vertices; counts of what stays behind; κ address), 🪬 (hold.html, verify a Hold locally: signatures, refs, Merkle root, bearer sig, key `holds{root,count}` agreement, byte budget, projection of counts and states) and 🤝 (join). Upstream has none of the three.
- The City did not name them: `starkey.md` step 4 said "root and a count, never the items" with no mark or page; `get-star-key.md` called the Star "what your Hold reveals, as a figure" (wrong: the figure is the key's reading, the Hold is the sidecar); `join.html` "Try Star Key →" reaches only the web build of the reading page; nothing anywhere mentioned the Hold pane.
- Fixed in copy: `get-star-key.md` gained "What the Star holds · the three marks in the header" with the byte ladder measured on the reference fixture (7 items; hold file 18,992 B; envelopes 6,478 of 24,576; projection 2,192; whole key 504; `holds{root,count}` 92 B). `starkey.md` step 4 now points at 🪬 / 📤 and the section.
- Not built, said plainly on the pane and the page: presenting k vouches under the root (Merkle path each); "Create ZK proof" on the reading page is a disabled button. The members home does not yet show the member's `holds{root,count}`; that is the natural next integration (the door reads it from the key the wallet carries).

Pushed: star-key eb35a1f + tag v0.2.0 + release (star-key-0.2.0.zip attached, latest/download 200); mages.city 3c4c9e7 then this commit. Live front needs `npx wrangler deploy` (Mitch; `npm run deploy` also runs verify:front, which needs the local front on :3334).
