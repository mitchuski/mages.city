# Formally verified parts of this repository

Sealed in the κ registry: formal_mage evidence bundle `evidence/2026-11-04_83`, root `sha256:81f2dd578a4fb486c502268e38fcd1302509f6c19656e5410d32946dd5a6f703` (83 theorems, 83/83 within the standard axioms).

Sealed beside it: formal_mage evidence bundle `evidence/2026-11-12_tt188`, root `sha256:c52609b736406d6fe646db7e735e7380d4fb6309cc9c481480fb9709c5077e8e` (188 theorems on the protocols trust tasks are written in, from [trust-tasks-formal](https://github.com/mitchuski/trust-tasks-formal) at `34d3353`, every one in its `Checks.lean` audit; published there under `evidence/`, beside the earlier 183-theorem seal `adcfbf13`).

Code here whose guarantee carries a machine-checked receipt in `formal_mage` (Lean 4, core library, kernel-checked, axiom-audited). `node tools/formal_census.mjs <this repo>` in formal_mage fails if a tag names a theorem outside the audited census.

| Claim | Code | Status | Tag |
|---|---|---|---|
| The Sigil check refuses every single-character substitution (K prime, K > N = 1353) | `site/sigil/sigilcode.js` (vendored, upstream johnservil/sigil) | proved | formal: proved formal_mage:Formal.Sigil.substitution_detected |
| The Sigil check refuses every swap of two adjacent, different characters | same | proved | formal: proved formal_mage:Formal.Sigil.transposition_detected |
| The least admissible K for N = 1353 is 1361, prime | same (`LEAST_K`) | proved | formal: proved formal_mage:Formal.Sigil.deployed_least_k |

"K prime" enters the Lean statements as Euclid's lemma; the step from the code's trial-division `isPrime` to it is cited, not checked. Open: `decode ∘ encode = id` and the minimality of `layout` (formal_mage O17). The City Key's packets and chains roots use the legacy packets tree, recomputed in full with a count; their code-to-model lemma is open (O1b).
