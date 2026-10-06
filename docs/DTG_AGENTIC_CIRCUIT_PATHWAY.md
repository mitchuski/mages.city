# From the Proof Links to a DTG circuit workshop

Status: user-directed design proposal, 22 September 2026. The golf contributions are operational evidence for a bounded circuit-development workflow. The community compiler and its DTG deployment adapters are proposed, not implemented or ratified here.

## Purpose

The City of Mages develops a community pathway for producing fit-for-purpose zero-knowledge presentations of credentials and trust-graph relationships. An agentic compiler assists the journey from a precise requested claim to a formally checked circuit, an exportable witness program, a reproducible proving artifact and an accountable presentation.

The Proof Links is its practice course. zk.golf supplies bounded problems and visible cost comparisons; the ZK Book supplies conceptual and specification-linked study; Clean and Lean supply a formal circuit-development lane; the DTG community supplies use cases, policies, review and independent reproduction. The deeper purpose is enabling people and their agents to prove the particular trust relationship a task needs while controlling the information disclosed.

“Agentic compiler” names an assisted, gated toolchain. Natural language is an intake surface. It is not an executable policy or sufficient authority to select a disclosure set. The first deliverable is a narrow vertical slice, not a general compiler of arbitrary graphs or a claim that every target backend is verified.

## One pathway, distinct responsibilities

| Stage | Artifact | Acceptance boundary |
| --- | --- | --- |
| Request | Versioned predicate/presentation card | State the relying-party purpose, credential schemas, public inputs, private witness, assumptions, disclosure, nonclaims, adversary and lifecycle horizon. Resolve ambiguity with the responsible community/holder. |
| Specify | Lean relation and explicit assumptions | Human review that the relation actually expresses the requested claim. A perfectly proved wrong specification is still wrong for the task. |
| Compose | Clean circuit and explicit witness IR | Select attributed gadgets with matching fields, encodings, ranges and supported interfaces. Preserve assumptions through composition. |
| Prove | Kernel-checked theorem closure | Soundness, completeness and target-specific shape, witness and channel obligations. Record allowed axioms and dependency pins. |
| Export | Constraint artifact and executable witness generator | Verify correspondence to the checked source and public-input ordering; pin compiler/exporter/backend versions and hashes. Do not silently substitute an unchecked native witness path. |
| Exercise | Real proof and verifier receipt | Honest cases, malicious witnesses, altered inputs, stale state and replay failures, measured cost/runtime/memory, backend/setup requirements. |
| Reproduce | Independent build and evidence packet | A separate community participant reproduces the specified artifact and tests. Separate same-model contexts on one machine are not independent hardware reproduction. |
| Present | Purpose-scoped presentation and policy decision | VTA/Trust Task adapters check audience, challenge, freshness, issuer/status roots and permissions; the relying party makes the authorization decision. |

The Mage/proposer proposes implementation and optimization. The Swordsman/assayer checks frozen bytes and every required obligation. The holder authorizes disclosure; community editors own specification decisions; registry maintainers admit evidence; authorized operators release deployments. A benchmark entry does not automatically become an approved production gadget.

## What a trust-graph presentation can mean

Candidate relations include possession of a credential issued under an accepted issuer policy, a role or qualification without unnecessary attributes, membership in a committed set, a bounded delegation path, satisfaction of a threshold of appropriately distinct attestations, or a freshness/range condition. Each needs its own exact semantics.

Graph membership proves a relationship to a particular committed snapshot. The verifier must know why that root is authoritative and current. Hidden paths must still bind edge direction, edge types, signatures or authenticated issuer commitments, holder endpoints, path-length limits, delegation scope, expiration and relevant revocation state. Counting vertices or signatures alone does not establish independent issuers or witnesses. Cycles and repeated identities must not satisfy a distinct-party threshold accidentally.

A proof of an accredited attestation does not prove that an underlying biometric or real-world judgment was correct. Nor does a sound circuit alone establish end-to-end zero knowledge, unlinkability or a privacy budget. Those claims depend on the proof system, public outputs, setup, transcript, state changes, transport metadata and adversary model. Compose disclosure analyses alongside circuits: graph roots, stable identifiers, nullifiers and Star fingerprints can correlate presentations.

## First vertical slice: a scoped community-role presentation

Use synthetic credentials and a small authenticated membership tree. The reviewed card asks: the holder knows the secret bound to a leaf in an accepted issuer's current role set, and the leaf's validity period covers the declared verification time. Reveal the approved role claim and context, while withholding the leaf identity, secret and authentication path.

Public statement: versioned policy/profile, approved root and snapshot epoch, role claim, verifier audience, fresh challenge, time and a defined presentation-binding output. Private witness: holder secret, credential fields and membership path. Every claimed binding must participate in the relation or an explicitly identified authenticated wrapper; merely supplying an unused public field is insufficient.

The verifier authenticates the issuer/root and its freshness under policy. The circuit enforces membership, holder binding and field/range relations. The surrounding protocol consumes the challenge and applies revocation/snapshot policy; a circuit does not obtain current time or live status by itself. Specify whether any nullifier is needed, its derivation and intended linkability before adding one. This is a reference profile for review, not a DTG standards decision.

Required rejections: wrong secret or path, wrong issuer/root, altered role, expired credential, stale snapshot, wrong audience/challenge, reused challenge and altered public-input encoding. Include a joint-view disclosure review and demonstrate that private witness data never enters published build logs or receipts. The acceptance packet must separate circuit rejection from protocol/policy rejection.

## Delivery sequence for mages.city

1. **Predicate-card intake.** Reuse the DTG evidence repository's board format. Add field/encoding, graph-bound, leakage and lifecycle requirements. Surface unresolved choices as unresolved, not compiler defaults.
2. **Clean reference adapter.** Implement the single reviewed relation and witness program under pinned dependencies. Export to one supported proving backend and perform actual proofs. Measure the exporter trust boundary rather than claiming it is closed by the source theorem.
3. **Independent evidence packet.** Bind source, relation, theorem/axiom report, build inputs, exports, verifier key/setup identifier, fixtures, metrics and disclosure profile. Use synthetic fixtures; never publish the holder's witness. Reproduce on another participant's hardware before claiming community reproduction.
4. **Board integration.** A proposed mages.city proof-request card points to the relation and evidence. Qualification, review, admission and release remain separate statuses. Board evidence links are not permissions. No new public endpoint or registered Trust Task is claimed by this plan.
5. **VTA presentation adapter.** Connect one authorized holder, audience and versioned task to proving and verification. Produce an actual scoped receipt. Keep private originals in holder custody and existing human/broker release boundaries intact.
6. **Graph composition.** Only after the slice works, add bounded delegation and multi-issuer policies, explicit composition theorems and joint-disclosure analysis. Version profiles and invalidate/review artifacts when schemas, issuer policy, roots, compiler pins or assumptions change.

Cost optimization is a later pass over an already correct relation. The course teaches that pass without making low constraint count the only objective. Suitability also includes assurance scope, proof latency, witness custody, memory, portability and operational verification cost.

## The City telling and the board plan

In the lore, the course opens onto the working forge. A mage practises a stroke, then carries its proved method to a community commission. The commission says what must be shown, to whom, and what must remain private. Soulbae 🧙 shapes the circuit; Soulbis ⚔️ checks the unchanged promise; the bearer decides whether to present it. The ZK Book is both a course companion and a guide into that deeper workshop.

The City design copy lives at `cityofmages/mages-city/DTG_AGENTIC_CIRCUIT_PATHWAY.md`. The mages.city working repository carries an explicitly labelled planning mirror in `docs/DTG_AGENTIC_CIRCUIT_PATHWAY.md`. Existing deployment decisions and `deploy/` remain deployment authority. This plan adds no live feature, canonical vertex, keeper or signed City binding. Site publication and DTG specification promotion are separate operations.

## Sources and evidence status

- [Build with Clean](https://clean.zksecurity.xyz/building-with-clean/): inspected 22 September 2026, including the client-rendered guide. It explains specification-first development, circuit soundness/completeness, explicit WitGen IR and a BN254/R1CS plus WASM witness export example feeding snarkjs. Backend examples do not establish an audited end-to-end deployment here.
- Maintainer's `dtgwg-zkp-tf-mage/README.md` and `AGENT-RUNTIMES.md`: inspected local task-force mission and card/runtime/independent-run/registry process. These distinguish accredited attestation from underlying truth and evidence from specification authority.
- Maintainer's `dtgwg-cred-spec-main_mage/zkbook/README.md` and evidence repository README: inspected book/evidence/specification boundaries. Historical runtime figures were not rerun in this work.
- `cityofmages/mages-city/KNOWLEDGE_SPACES.md`: holder custody, scoped Star projection, versioned Trust Tasks, actual receipts and explicit deployment state.
- Maintained zkgolf_mage instance frontiers and immutable runs: the current source for exercised primitive optimizations. GF(2) benchmark gadgets do not transfer unchanged into a prime-field DTG backend; field and compiler compatibility must be proved.

(⚔️⊥⿻⊥🧙)😊
