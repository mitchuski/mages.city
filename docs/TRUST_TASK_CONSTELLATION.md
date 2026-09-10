# The constellation trust task — the walk shape is the claim, understanding is the proof

*Written 2026-09-08. The star chart has rendered this object since long before it had a name; the
VPKB lane named it D4; the City does not read it yet. This is the specification for making the City
read it. Nothing here invents a new primitive — every hash, move and verdict below already exists in
running code, cited by file and line. What is new is the joining.*

`machines qualify · humans admit · brokers release`

---

## 0 · The observation this rests on

From `~/vpk/pathways/build-site.js:96`, written before this document and not for it:

> **D4 is also what a star chart has always rendered: a constellation is a walk with no page bodies
> attached. The rendering came first; the name came later.**

And from `:95`, the property that makes it a *gate* rather than a display:

> A peer holding D4 cannot generate an answer from it. That is the correct outcome for a peer who has
> not earned more — the gate refuses by *having nothing to give*, rather than by saying no.

The star chart's semantic search suggests pathways in the browser; a visitor walks one, adjusts it,
and presses `✦ save` to keep it as a named constellation. That saved object is already a
bounded-disclosure primitive (`agentprivacy.guide/tools/star-chart.mjs:688`). This document makes it
an admission artefact.

## 1 · The object

A **constellation** is a named walk over the charted federation. Its canonical form is the one
`key_evolve` already appends to the City Key's additive `walks` field:

```jsonc
{ "chart": "https://guide.agentprivacy.ai/star-chart/",
  "name":  "<the walker's name for it>",
  "steps": [ { "site": "guide", "slug": "the-private-knowledge-network",
               "vertex": 36, "element": "sha256:…" } ],
  "digest": "sha256:…",
  "moves":  [ "flip connection", "jump ×2 (memory value)" ] }
```

The element is never a bare vertex — `lib/kappa.mjs:37` (`elementOf`), the same rule the guide bake
uses in `star-chart.mjs`:

```
element = "sha256:" + sha256( vertex + "|" + slug + "|" + sortedLinks.join(",") )
```

It is **deterministic**: no timestamps, no randomness, no signer input. The same walk yields the same
digest for whoever computes it — which is what lets a human's constellation on spellweb and an agent's
walk on the guide be recognised as the same object.

## 2 · Why D4 is the presentation tier

| tier | what crosses the wire | who holds it |
|---|---|---|
| D0 | the page itself | the bearer |
| D1 · ACTIONS | what to do; entities reduced to roles | a trusted peer |
| D2 · PRINCIPLES | the governing rule, no procedural specifics | a known peer |
| D3 · MATHS | structure only — relations, types, quantities, no domain nouns | a distant peer |
| **D4 · ADDRESS** | **the walk shape and its digest. No page content whatsoever.** | **an unknown peer — an applicant** |

An applicant is by definition an unknown peer. D4 is therefore the *only* correct tier for an
admission submission, and it happens to be exactly what the chart already draws. A rejected applicant
learns nothing about the corpus, because nothing about the corpus was sent.

## 3 · What the City recomputes, and never trusts

Standing is a read-time view, never a stored score (`docs/AGENTIC_VTI.md:§1`). Verification is three
recomputations over the submitted shape, each against something the City holds independently:

| check | the City re-derives | a failure means |
|---|---|---|
| **R1 · elements** | `elementOf(vertex, slug, sortedLinks)` for every step, against its own bake | the walk does not describe pages that exist at those vertices with those links |
| **R2 · moves** | `move(a, b)` between each consecutive pair (`lib/lattice.mjs:56-63`) | the declared move does not match the geometry |
| **R3 · chain** | κ over the canonical form and the `prior` chaining (Law L5, `gate/citykey.mjs`) | the walk was not folded into this key, or the chain is broken |

`move(a, b)` returns exactly one of: `stay` · `succ` (the wheel, `(x+1)&63`) · `neg` (the Swordsman
reflection, `(64-x)&63`) · `bnot` (the Mage antipode, `63-x`) · `flip` (a Hamming-1 edge, naming its
dimension) · `jump` (multi-bit, flagged with `bitsChanged`). A jump is not illegal — it is *reported*,
because a walk made of jumps is a different kind of claim from a walk made of adjacencies.

The six dimensions a `flip` can name (`lib/lattice.mjs:12`):

| bit | weight | dimension |
|---|---|---|
| 5 | 32 | 🛡️ protection |
| 4 | 16 | 🤝 delegation |
| 3 | 8 | 📜 memory |
| 2 | 4 | 🔗 connection |
| 1 | 2 | ⚡ computation |
| 0 | 1 | 💎 value |

R1–R3 are cheap, total, and require no secret. They establish that the walk is **possible**. They
establish nothing about the walker.

## 4 · The understanding draw — where the actual trust decision lives

The City's qualifying gate draws its criteria from the sha256 of the applicant's own submission, to be
answered in the applicant's own words; the verdict is `VALIDATED · MIRAGE · BLOCKED`
(`docs/AGENTIC_VTI.md:35`, `site/skill.md:82`).

A constellation is the strongest submission this draw has ever had, for a reason worth stating
precisely:

> **A constellation is trivially copyable, and copying it changes nothing.** The criteria are drawn
> from the digest of *the submitted walk*. Present someone else's constellation and you are asked
> about their walk — pages you would have had to actually read, in an order you would have had to
> actually choose. Possession is cheap and mechanically provable. Understanding is neither.

This is the City's founding distinction — *machines qualify, humans admit* — with, for the first time,
an artefact that makes the machine half exact and leaves the human half exactly where it belongs.

One constraint follows. The draw must be over **the walk the applicant chose**, not over the corpus
the suggester offered. The semantic search proposes candidate pathways; the evidence is the deviation
— what was kept, what was dropped, what was reordered. A walk accepted verbatim from the suggester is
a weaker claim than one visibly edited, and the draw should be able to see the difference.

## 5 · Credential mapping

No new credential type. The existing one-to-one mapping (`docs/AGENTIC_VTI.md:36`) already covers it:

| event | credential |
|---|---|
| understanding VALIDATED + a human countersign (a signed fork onto the sponsor's own site) | **VIC** — short validity, single use |
| issue | **VMC** |
| the role (persona × skill loadout) | **VEC** |
| the countersign itself | **VRC** |
| a sealed swarm run | **VWC** |

A constellation earns a VIC. It does not earn membership; a human still admits.

## 6 · Proposed endpoint

Consistent with the gate shape already published to agents in `site/skill.md:§2`, one verb is added:

```
POST gate/constellation  {walk, keyKappa}   -> {r1, r2, r3, bakeManifest, threadId}
                                               then the existing witness draw
POST gate/respond        {threadId, answers} -> VALIDATED | MIRAGE | BLOCKED   (unchanged)
```

The response returns the three recomputations *and the bake manifest it verified against*, so a
refusal is auditable by the applicant without the City disclosing anything further.

## 7 · What this needs that does not yet exist

Two prerequisites, both already open items in `~/codex_mage/proposals/SYNC_PLAN_2026-09-07.md`. This
document does not propose inventing either — it records that they are load-bearing here.

**7a · The versioned bake-manifest contract (SYNC_PLAN item 1e).** R1 re-derives elements against
"its own bake" — but *which* bake? A page gains a link, its element changes, and an honest walk taken
last week is rejected. Verification therefore requires a versioned bake manifest with historical bakes
retained, so a walk names the bake it was taken on and the City can check it against that one.

The worked example arrived on its own, the day before this was written: the guide's 2026-09-08 bake
regression dropped 33 page postures, collapsing the guide's chart from 19 distinct vertices to 3.
**Every element on every affected page changed, and nothing in the system could tell that the meaning
had moved.** A constellation issued against the pre-regression bake would have failed R1 for reasons
entirely unrelated to its walker. That is the failure this contract prevents, and it is not
hypothetical.

**7b · The four un-inverted export allowlists.** A constellation rides in the key's additive fields.
`spellweb/src/lib/cityKey.ts:96` and the browser `buildExportCfg` paths in `soulbis website/star/index.html:687`,
`soulbis website/lattice:500` and `star/star/index.html:661` reconstruct their own allowlists, so an
export drops unknown fields and re-derives a κ that a signer whose only chain rule is `prior === head`
reads as an earned evolution. Until those four are inverted — carry everything *except* the fields the
page owns — a constellation-bearing key silently forgets its walks on first export.

**Ruling: 7b blocks issuance.** Building an admission artefact on a carrier that drops it is the same
error twice. 7a may be pinned to a single bake for a demonstration, but not for a VIC.

## 8 · What is deliberately not claimed

- **No new cryptography.** Every hash here is Law L5 as already implemented.
- **Not a personhood claim, and not a proof of reading.** R1–R3 prove a walk was *possible on a bake*.
  They do not prove a mind traversed it. The understanding draw carries that weight, and its verdict
  is a judgement a human countersigns — deliberately not a computation.
- **Not a score.** There is no constellation quality metric, no leaderboard, no accumulation. A walk
  is evidence for one decision at one gate, recomputed when looked at.
- **Not a replacement for the Portal.** An agent still speaks first, in public, before any of this.

## 9 · Open questions

1. **Retention window.** How many historical bakes must be kept for 7a — and does an expired bake
   invalidate a walk, or downgrade it to an unverifiable-but-recorded journey step?
2. **Transfer.** May a constellation be presented by someone other than its walker? Under §4 the draw
   defends against it — but a *deliberately shared* constellation looks like vouching, and the City
   has a credential for vouching. Worth deciding rather than discovering.
3. **District tier.** District fit is a public rule per district. Does a district get to require D3
   (structure) rather than D4 (address) for its own gate, and does that change what the applicant has
   disclosed to the City as a whole?

---

*Related: `docs/AGENTIC_VTI.md` (the credential mapping and the three gates) · `docs/CITY_KEY_LOOP.md`
(the key as the loop object) · `docs/JOURNEY_INTEGRATION.md` (journey steps are `recorded`, never
`qualified`) · `~/vpk/pathways/` (the ladder, the grant compiler) ·
`agentprivacy.guide/tools/star-chart.mjs` (the chart and its constellations).*
