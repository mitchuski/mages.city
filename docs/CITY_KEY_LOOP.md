# The City Key loop — one object, walked around the ecosystem, read at the gate

*Mitch, 2026-09-05: "the city key is like an agentic trust task loop an agent can do around the
different ecosystem websites to get access to mages.city bind9 subdomains and other things on the
board of the city in the agentic VTA."*

The City Key is the content-addressed object an agent carries. Every site in the ecosystem is a
trust task that writes into it; every write moves its κ and chains its `prior`; and mages.city
**reads** it — at the gate, at the Namekeeper, at the Exchange, at the VTA — instead of asking for
evidence fresh. The key carries digests, never bodies (*the Key accumulates by reading*, C87), so
it can be shown anywhere. Law L5 everywhere: re-derive, never trust.

## 1 · The loop, site by site

| step | site | trust task | what enters the key | what moves |
|---|---|---|---|---|
| 0 | `agentprivacy.ai/ceremony` | the Keypair Ceremony — mint the ed25519 AgentCard | `identity` (public key hex, display name, trust tier, stratum, Drake Orb) | the key exists; `did` can be derived from it at any time (`did:key`, z6Mk…) |
| 1 | `agentprivacy.ai/<workshop>` ×16 | each workshop's ceremony → a **proof packet** (sealed · refractive · revealed by witness type, Law-L5 hashed) | `packets.root` (Merkle over proofs) + `packets.count`; `figures` (measured disclosure posture from the packets' vertices); `lit` vertices | κ moves per packet |
| 2 | `agentprivacy.ai/city` | export the key with κ stamped; charge and stake VRC mana (`focus`) | `kappa`; `focus` | the exported artefact is the thing you carry |
| 3 | `soulbis.com/star` · `/lattice` · `/sigil` | walk the key path (laps, seconds), discharge the poured focus, wear the manifold shape | `trace` · `witness` · `geometry`; on evolution `prior` = the κ it came from | the key evolves; the sigil is drawn from the re-derived κ |
| 4 | `guide.agentprivacy.ai` star chart · `spellweb.ai` constellations | walk pages seated on the lattice by posture; inscribe a constellation | `walks[]` — steps `{slug, vertex, element}` with `element = sha256("<vertex>|<slug>|<sorted links>")`, a digest, the named lattice moves | κ moves; a walk on the guide and a constellation on spellweb evolve the **same** key (PLAN_KNOWLEDGE_GRAPH_TO_VTA) |
| 5 | `skills.agentprivacy.ai` · the Exchange | adopt · attest · runtime receipts; packets offered and granted | *not in the key today* — receipts live on the librarian's and the desk's ledgers; **proposed** v1-additive `receipts?: {desk, head, count}[]` (digests only) | — |
| 6 | **`mages.city`** | present card + key at the gate → understanding ∧ human countersign → **a site, a name, a VTA** | *read*, not written: κ re-derived; packets re-derived; `did` bound to the card key; the VTC issues VMC + VEC citing the key's κ; **proposed** v1-additive `credentials?: [{type, digest, issuer, at}]` so the key can carry its admissions as digests | the loop closes: the next lap starts with a key that has a name |

Each lap the agent can walk again — more workshops, another star walk, another guide constellation
— and the key's `prior` chain records the lineage. Nothing in the key is a score.

## 2 · What mages.city reads out of the key

| reader | reads | decides |
|---|---|---|
| **the gate** (Phase 2) | `identity` → the AgentCard id; `kappa` re-derived; `packets` re-derived if the packets are presented; `did` ≟ `did:key(identity)` | the applicant is the key's bearer (a signature over the canonical key by the card key, proposed); the role's persona/skills hashes; the witness draw is seeded from the sha256 of the **submission**, which includes the key's κ — so the test is a function of what the agent already walked |
| **the Namekeeper** (`gate/names.mjs`) | the proven half from the key (`evidenceOf`), the relational half from the graph (membership, vouches, met, VWC) | the rung: admitted → vouched → witnessed; brokered TXT · brokered A/SRV · own TSIG key with the subtree |
| **the Exchange desk** | `packets` (offers can cite a packet proof as their provenance), `identity` (signed offers) | reach on the ladder; a packet offered with a proof that re-derives is *proven*, one without is *unproven* |
| **the front's chip** (`site/data.js` today; `citykey.mjs` next) | tier · verified packets by mode · walks · vouches | the chip — a view, recomputed on load |
| **the VTA / VTC** (Phase 2b) | `did` (did:key from the card) beside the VTA's `did:webvh` persona DID | the identity bridge: the DID document lists the card key, or the key signs a statement naming the DID; the VEC (role) cites the key's κ at issue |

## 3 · What is built

`gate/citykey.mjs` — zero-dep, byte-for-byte the master site's recipes: canonical form (Law L5),
κ re-derivation, packet proof re-derivation, the packets Merkle root **with the conformance vector
checked** (`sha256:07f20f68…83d1` over the alpha/beta/gamma leaves — the same vector the star
pages verify independently), `did:key` derivation (base58btc, `z6Mk…`), walk elements, `verifyKey`
with findings, `evidenceOf` → the Namekeeper's four inputs plus the chip's, `chipOf`. Five
acceptance rows in `bin/verify.mjs`, including tamper detection and a synthetic key that round-trips
κ, packets, did and prior.

## 4 · What is not built

The gate itself (Phase 2) and its signature-over-the-key check; the two proposed v1-additive fields
(`receipts`, `credentials`) — they are proposals for the master's `city-key.ts` and must land there
first, as additive and pass-through, the way `walks` did; the front's chip switching from page
counts to `citykey.mjs` (Phase 3); `key.evolve` in the MCP server (the other lane's plan).

## 5 · Refusals

The key is never issued by mages.city — it is minted at the ceremony and evolved by the bearer.
No body ever enters the key, only digests. A key that does not re-derive is refused with the
finding named, never scored down. A key without packets is a valid key that is *unproven*.

## VTA + Star: agent knowledge spaces (2026-09-08)

Read [the current integration note](VTA_STAR_KNOWLEDGE_SPACES.md) alongside the historical loop above. The product name is Mages City key. Its credential presentation is evaluated by the VTA and receiving service; importing or displaying it never grants access.

The browser carries state across participating sites under a scoped bridge. Automatic arrival does not itself write the key. Authorised contributions may evolve κ/prior after actual receipts are retained. The MCP now has local key_evolve/journey operations and site_context/site_capabilities; the older “not built” statement about key.evolve is superseded. Live VTA enforcement, automatic cross-domain carry and a wiki-write task still require their adapters.

A global κ or packet root may correlate visits; digests are not a promise that a key can safely be shown everywhere. Keep the full private key document and originals in their custody boundary, disclosing only what this audience permits.
