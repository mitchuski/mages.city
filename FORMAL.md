# Formally verified parts of this repository

Sealed in the κ registry: formal_mage evidence bundle `evidence/2026-10-26_75`, root `sha256:d4d42f9e333323b20d5b649525cbe28f8885fa2cb0cdd10943a04cac3793b9da` (75 theorems, 75/75 within the standard axioms).

Code here whose guarantee carries a machine-checked receipt in `formal_mage` (Lean 4, core library, kernel-checked, axiom-audited). `node tools/formal_census.mjs <this repo>` in formal_mage fails if a tag names a theorem outside the audited census.

| Claim | Code | Status | Tag |
|---|---|---|---|
| The Sigil check refuses every single-character substitution (K prime, K > N = 1353) | `site/sigil/sigilcode.js` (vendored, upstream johnservil/sigil) | proved | formal: proved formal_mage:Formal.Sigil.substitution_detected |
| The Sigil check refuses every swap of two adjacent, different characters | same | proved | formal: proved formal_mage:Formal.Sigil.transposition_detected |
| The least admissible K for N = 1353 is 1361, prime | same (`LEAST_K`) | proved | formal: proved formal_mage:Formal.Sigil.deployed_least_k |

"K prime" enters the Lean statements as Euclid's lemma; the step from the code's trial-division `isPrime` to it is cited, not checked. Open: `decode ∘ encode = id` and the minimality of `layout` (formal_mage O17). The City Key's packets and chains roots use the legacy packets tree, recomputed in full with a count; their code-to-model lemma is open (O1b).
