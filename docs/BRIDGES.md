# Bridges — the City as the lab for the secure information-sharing agent ecosystem

*Mitch, 2026-09-05: "we want the secure information sharing agent I've built at the community
agents to feed in here … varying degrees of artefact thresholds and provenance graph work,
promise knowledge graph, syncing into the spellweb and star workflows — this ecosystem will host
much of the experiments and labs for that secure information sharing agent ecosystem."*

mages.city is where those experiments run: agents feed artefacts in through thresholds, the City
computes the provenance graph over them, and the graph syncs outward into the two instruments the
universe already reads — spellweb (the knowledge graph) and the star chart (the sky of walked
paths). Nothing in this file scores anyone. Built pieces are named; everything else is planned.

## 1 · The first feeder: the Community Security Agent

The agent is open source, from the Cyber SMART Research Center
([community-security-agent-public](https://github.com/smitgu/community-security-agent-public));
the keeper runs an instance of it, and that instance is what feeds the City — as the resident
`systerrae`. Upstream owns the tool; the City is a place its output can go. The agent already does
the hard part. Its **sensitivity gate**
classifies every document `PUBLIC | INTERNAL | CONFIDENTIAL`, redacts entities, generalises
amounts and dates, and holds anything above PUBLIC for **human review** (`review_status` pending →
approved). That gate **is** the Exchange's render step, and its review state **is** the human gate.
What the Exchange adds on the way in is *a provenance record with earned weight*: terms that carry
provenance, and receipts and corroboration that carry weight.

### Artefact thresholds

| the agent says | review | the City offers | what is public |
|---|---|---|---|
| `PUBLIC` | approved | **D4** | card + the safe text + the IoC lists, rendered on a page |
| `INTERNAL` | approved | **D3** | card + the sha256 of the safe text the agent holds; the body moves only under a grant, VTA to VTA |
| `CONFIDENTIAL` | approved | **D2** | a card in **roles, not names** (*an uploading organisation reported …*), the hash of what the agent holds; a grant + terms to read |
| any | pending | **nothing** | humans admit — nothing leaves before review |

The provenance record rides in the packet's terms: `attribution` (publisher) · `source_kind`
(discourse | upload) · `source_ref` (a forum URL, or `upload:<digest12>` — never a filename) ·
`content_hash` · `classification` · `scrubber` · `entities_redacted` · `no_train` (true above
PUBLIC) · `expires`. Packet names are `csa-<finding id>`, so a re-run is idempotent (the desk answers
409 for a packet already offered).

**Built:** `bridges/community-security/feed.mjs` (dry-run prints the packets; `--post` offers them
on the desk as the resident `systerrae`, who presents the Witness persona — *the source must be
protected, the story must be verified*), a synthetic fixture in the agent's export shape, seven
acceptance rows. **Not built:** reading the agent live (export the approved findings to a file — a
keeper act) and the return path (a City receipt or corroboration written back to the agent's
`sources` table, offered upstream as a PR).

## 2 · The provenance graph: Knowledge × Promise → Trust

The desk computes three graphs at read time (`GET /graph`) and never stores them:

| graph | nodes | edges |
|---|---|---|
| **Knowledge** (the substrate) | packets · agents · sources | `forged_by` (packet → holder) · `anchors_to` (packet → source) · `corroborates` (the same content hash offered by **distinct** holders) |
| **Promise** (the bilateral overlay) | agents · packets | `grants` (holder → reader: scope · cap · expires · terms digest · live?) |
| **Trust** (the overlap) | agents · packets | `adopted` · `witnessed` (attest with a run ref) · `corroborates` · `vouched` (a fork on the wiki, added by the exporter) |

Corroboration is the agent's own thesis made an edge: *the same content hash from distinct
publishers raises weight; configuration does not.* A refusal is never an edge.

## 3 · Syncing outward: spellweb and the star

`bridges/graphs.mjs` reads the desk, the Hall roster and every resident's journals and writes:

| file | shape | vocabulary |
|---|---|---|
| `bridges/out/provenance.json` | the three graphs + forks | the desk's |
| `bridges/out/spellweb.graph.json` | `{nodes, edges, edges_extension}` | spellweb's union: nodes `artefact` (with `proof: sha256:…`) · `cast` · `document`; edges `forged_by` · `anchors_to` · `witnessed_by` · `relates_to` (why: corroborates) · `references` (why: adopted) · `kin_to` (why: fork). The Promise graph's `grants` edge is parked in `edges_extension` for the Phase 7 vocabulary pass — one union extension, the A5 pattern |
| `bridges/out/star.json` | Skill Sync's `starchart.json` shape: `built · cats · stars · edges · constellations · runtimes · runtimesProof` | stars = packets (📦, tier = disclosure) and residents (🪪); edges weighted by kind (attested 7 · fork 5 · corroborates 4 · adopted 3 · forged 3); one constellation = the Exchange's offers in order; runtimes = attestations with their run refs; the proof = the desk's ledger head |

Loading these into spellweb and the sky is Phase 7 (the reflect phase): spellweb's importer
(`spellweb.bearer.packets` → dedup by proof) and Skill Sync's `build-starchart.js` both take
these shapes today; the wiring is the remaining work, plus the `grants` edge in the union.

## 4 · The lab, then

| experiment | where it runs | what it measures |
|---|---|---|
| threshold fidelity | the feeder + the desk | what each tier hides and what it destroys: a labelled bank of incident sentences, PII spans vs evidence spans — the gate measured on both |
| corroboration weight | `/graph` over two or more feeders | how many distinct holders a finding gathers, and how fast; never a score, always a count with names |
| promise SLAs | the Promise graph | grants honoured vs lapsed; share promises as measurable terms |
| the inbound gate | the desk's residents-only rule + the Namekeeper's rungs | who may feed at all |
| the ceiling | D2/D3 packets never carry bodies through the City | the leak path stays closed by construction, not by policy |

## 5 · Refusals

No real incident data through the twin — the fixture is synthetic. No finding leaves before
review. No filename in a public term. No body above D4 through the desk. No score on a
publisher: weight is corroboration and receipts, with names, counted.
