# Star Key: the why, and one journey from the City

2026-11-12 · draft in words, for Mitch to settle before anything is built (expression before build).
Step 1 of three: **words** → members' home on `vtc.` → seals light the Star.

---

## 1. Who reads, and the one act

| Reader | Where they stand | The one act the page asks of them |
|---|---|---|
| **A visitor** | no wallet | understand why, then take the Star (download, load) |
| **A holder** | wallet loaded, no agent connected | look around locally (📤 🪬 need no agent), then connect an agent |
| **A connected holder** | wallet + VTA, not a member | knock: 🤝 with the City's DID, terms first |
| **A member** | admitted | go home: what the City sees of you, your rooms, your agreements |

One page, four doors. Each reader sees only the next step.

## 2. The why, in one breath

> **Star Key is how you carry yourself into the City without the City carrying you.**
> You knock with your own terms, you show only what you choose, and every door you pass becomes a point of light on your Star.

Three moments, replacing "three marks in the header" as the way the guide opens:

- **Knock (🤝).** You arrive with your terms already chosen. The City answers yes, offers its own terms, or says no. Both sides keep the record.
- **Show (🪬).** The City sees a root and a count, never what's inside. You can later show chosen items, each provable against that root.
- **Remember (Agreements).** Every door you've passed is an agreement you hold, not one the site holds about you. Collected, it's your agent's history of where you've been trusted.

Under all three: the wallet holds no signing key and the City keeps no custody. `machines qualify · humans admit · brokers release`.

## 3. Draft copy for the one page (`mages.city/star`)

**Heading:** Your Star

**Line:** Carry yourself into the City without the City carrying you.

**Body (three short lines):**
Knock with your own terms. · Show a root, not your record. · Keep every agreement you make.

**Then one of four panels:**

1. **No Star yet.** "Star Key is a browser wallet. It holds your identities and talks to your own agent; it never holds a signing key." → *Take the Star* (zip + hash, or the release) → *Load it* (three steps).
2. **A Star, no agent.** "Your Star already works on its own: read a City Key (📤) and check a Hold (🪬) without sending anything anywhere. To knock, connect an agent of your own." → *Connect an agent* (VTA farm, or your own).
3. **Connected, not a member.** "Knock with your terms. Press 🤝, give it the City's DID, and choose what you present." → the DID + QR, the City's terms (SD-BASE-DP, SD-BASE) and what they mean in one line each, and the human step: an invitation from the keeper, or a request that waits for a fellow mage.
4. **A member.** "Welcome home." → what the City sees of your Hold, your rooms, your agreement, your seals. *(Built in step 2.)*

**Footer:** what Star Key is (agentprivacy's fork of OpenVTC's wallet, same licence), and where the source lives.

## 4. A constraint that shapes the page

The page can't simply ask the wallet which panel to show. By design the wallet answers a page only where you've allowed it, and `membership.status` answers only on the City's sign-in portal origin (`vtc.mages.city`). So:

- **On `mages.city/star`:** the reader picks their panel ("Which is you?") and the page remembers the choice in the browser, with no wallet call.
- **On `vtc.mages.city` (step 2):** the wallet can answer, so the members' home detects a member and opens at panel 4 on its own.

Honest and simple: self-chosen on the City's front, detected at the door.

## 5. Facts to correct in the current guides

- `get-star-key.md` says 0.2.0 / 21 October. The next release follows the upstream merge (step-up 0.7, rooms, elections, notifications, termsOrigin, DID-doc lookup in 🤝).
- The terms' urls now point to agreements.info (staged in the five config copies).
- "Walk in by the members door" → `vtc.mages.city/members/` is vtc's own portal until step 2 lands.
- `starkey.md` opens with setup mechanics. It should open with the why (§2) and keep the setup steps below the panels.
- Name: Chrome shows **Star — Trust Experiment**, the guides say **Star Key**.

## 6. Decisions for Mitch

1. **The line.** Keep "carry yourself into the City without the City carrying you", or another?
2. **Name in Chrome.** Keep "Star — Trust Experiment", or rename to "Star Key"?
3. **A starter agent.** Point newcomers to the VTA farm only, or offer a City-hosted starter VTA they move away from later? (The second is a custody question the City has so far said no to.)
4. **Where the page lives.** `mages.city/star` (replacing star.html), or fold it into `get-star-key`?
5. **Panel 4 promise.** Name seals on the members' home now, or only once step 3 is built?

Once these are settled: one sketch of the page on the local preview, look together, then roll out.

---

## 7. Settled 2026-11-12 (Mitch)

1. **The line:** kept. "Star Key is how you carry yourself into the City without the City carrying you."
2. **Name:** **Star Key** everywhere. Chrome's "Star — Trust Experiment" is renamed at the next release.
3. **Agent:** the **VTA farm only** (or your own). The City hosts no one's agent.
4. **Where the page lives:** open. Mitch asked to see what already exists first (§8).

## 8. What already exists on these domains

| Where | What it is today | Fits the journey as |
|---|---|---|
| `mages.city/star.html` | **"The star of the chains"**: the evidence star (64 states, your face of the evidence, fold into a City Key) | not the wallet. **`/star` is taken** by another meaning |
| `mages.city/star-experiment/` | "Star Key experiment": a practice City Key + reading | panel 2's "look around locally" |
| `mages.city/join.html` | "Connect · Mages City workshop": 01 a VTA, 02 an OpenVTC client, 03 join by DID, 04 a human admits | **already the journey**, in four steps, client-first rather than Star-first |
| `mages.city/become.html` | "Should you join the City?": is it for you, what a mage does, what you hold | **the why** for the City, not for the wallet |
| `mages.city/get-star-key.md` | download, hash, load-unpacked, the three marks | panel 1's reference |
| `mages.city/starkey.md` | connect to your agent, get an invitation | panels 2–3's reference |
| `join.mages.city/` | the community's own site (vtc website template): Ways in · How joining is decided · What you hold · MyTerms | the door itself; linked **18×** from index/become/join/guide |
| `vtc.mages.city/members/` | vtc's own member portal (SignInPortal since DID v5) | panel 4, once step 2 lands |
| `soulbis.com/star/`, `guide.agentprivacy.ai/star-chart/` | family-site stars (linked from index) | a third and fourth "star" |

Two things stand out: **join.html is already the four-step journey**, and **"star" means three things** across the family (the evidence star, the wallet, the soulbis star).

## 9. Options for the page

- **A. Rework `join.html` into the four panels.** It's already the journey and already linked. It turns Star-first: "Your Star" panels, with the OpenVTC client as the alternative route. `become.html` stays the "should you?" and links in. `star.html` keeps the evidence star.
- **B. A new `mages.city/star-key/`.** Clean page, no clash with `star.html`. But it's a fifth page beside join, become, get-star-key and starkey unless those are folded in.
- **C. Put it on `join.mages.city`.** Closest to the door, but that's vtc's website template (`community.config.json`), with less room for the City's voice. Better kept as the door the panels point at.
- **D. Fold into `become.html`.** The why fits, but become asks "should you join the City?", which is a different question from "how do you carry yourself in?".

**Recommendation: A.** It turns the existing journey into the Star-first one and adds no new page. `get-star-key.md` and `starkey.md` become reference pages linked from panels 1–3.

## 10. Settled, continued (Mitch, 2026-11-12)

- **Page:** B, a new page. Sketched as `site/star-key.html` (served `mages.city/star-key`); top-level, so the shared header sync covers it. Not yet linked from the nav (the menu's ✦ Star Key still points at starkey.md).
- **The three stars:** *join them up.* The star of the chains is what lights your Star Key. Mitch: "the joining of the evidence as what lights on the structure of what is the wallet is powerful." Chronicle: master `docs/chronicles/2026-11-12_the-evidence-lights-the-star.md` (agentprivacy_master), unsigned.
- **Honest state:** folding a face sets the City Key's `focus` and `chains`. The wallet counts faces but draws `lit` (claimed, unverified import). Earned light from `focus` is the next build (chronicle §6 L1–L4).
