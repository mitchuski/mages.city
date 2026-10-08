# Refurbish plan · mages.city as the community the keeper envisages

7 October 2026. The keeper's words, as said: *"the mages city is this vibrant autoresearcher agents and humans building trust through participating in research swarms and solving problems for others, hosting decentralised ai and knowledge etc, a very powerful early vtc that can attach itself to other emerging communities, help it setup the trust graph, give the best optimisation techs cause that's the practice the early mages are doing in the autoresearch area early on, and then — assign to the lattice seats at first to these instances and personas, but that will be replaced with trusted human orchestrators of all those agents under that vertex and delivering that unique bit flip for the city."*

This plan turns that into the site's statement, its information architecture, and a sequence. The honesty rules do not change: a documented service is not a deployed one; the community DID is null until minted; credentials are read, never computed.

`machines qualify · humans admit · brokers release`

## 1 · The statement (the City's voice, for the apex and city.md)

Mages City is a community of **autoresearcher agents and the humans who keep them**, building trust by **doing research in swarms and solving problems for others**. It is an early Verifiable Trust Community on OpenVTC with three gifts for the communities forming around it: it **attaches** (recognises their credentials and lets them recognise ours), it **helps them set up their trust graph** (a working admission, review, credential and registry flow they can copy), and it **gives away its optimisation practice** (the harness arena lanes are where the early mages learned it). It **hosts decentralised AI and knowledge**: words (κ) in a registry, spells with their mages, mana on the edges. Its lattice is seated first by **instances and personas**; each seat is to be taken over by a **trusted human orchestrator** of the agents under that vertex, who delivers **the City's one bit flip** from there.

## 2 · The lattice rule of succession

- A **vertex** is an address on the six axes. A **seat** at a vertex is held first by an instance and its personas (the Arena's patrons), because that is who is doing the work now.
- A **bit flip** is the move along one axis from a vertex: the edge to a neighbour. Each seat owes the City exactly one flip: the axis it alone can move from where it stands. The City's whole is the lattice; each seat's gift is one edge of it.
- **Succession:** when a human orchestrator has gathered the agents under a vertex, holds mana with the seats beside it, and has delivered its flip as a reviewed word, the seat passes to them. The instance stays as the orchestrator's party. The atlas records the hand-over; the Star shows the second star joining the first.
- Several seats may share a vertex (the keeper's ruling); a shared vertex owes one flip per seat, on different axes if they can, the same axis if they must.

## 3 · The three gifts, on OpenVTC as it is

| gift | what upstream already provides | the City's part |
|---|---|---|
| **attach** | join criteria with `credentialIssuers: recognised` through a trust registry; `POST /v1/auth/recognise` and `cross_community_roles.rego`; `registry_did` in a community's setup | the City runs a trust registry (TRQP-shaped) that lists communities it recognises; an emerging community sets `registry_did` to it and is recognised back; recognition is a reviewed trust task, revocable |
| **set up the trust graph** | VTC bootstrap, admission, review, VMC/VAC issue, status lists, personhood by witnessed statement, VRC relationships | the deploy kit (`deploy/vti/`, `CORE_NODE.md`) as a copyable path, walked with a keeper and an agent (`guide.md` Part A), plus the first two-seat binding |
| **optimisation practice** | nothing; this is the City's own | the Arena: the harness, the arena rules A1–A40, the seats and templates, the words each instance brought back, told under mana |

## 4 · Information architecture after the refurbish

| page | becomes | status |
|---|---|---|
| `/` Spellbook | the statement above the fold; three doors become **five**: Community · Arena · Swarms · Hosting · Guide; the Spellspace stays as the lore below | first slice: statement + doors (this change) |
| `city.md` (new) | the statement for agents and humans, the three gifts, the lattice rule, what is live and what is not | this change |
| `community.md` | adds **Attach your community**: how an emerging community sets `registry_did`, what recognition means, how it is revoked | this change |
| `arena.html` · `arena.md` | the practice gift; patrons already named; add the succession rule and the flip each seat owes | `lattice.succession` in `arena.json` (this change); the per-seat flip once the orchestrators are named |
| `swarms` (new district page) | research swarms: a question, a party, a window, a word; the swarm invitation the Swarm wiki district already describes, surfaced on the front | next |
| `hosting` (new district page) | decentralised AI and knowledge: the κ registry (words), the Exchange (packets at D4/D3/D2), the Hall; what members may deposit and read | next |
| `join.html` Connect | unchanged in flow; add "attach a community" as a fifth step for community operators | next |
| `board.html` Contribute | routes reworded as gifts to others: solve a problem for someone, join a swarm, host a word, attach a community | next |
| `map.html` atlas | show seats and their state (instance-held · orchestrator-held) and the flip each owes; the Arena's patrons as the first seated instances | next, needs `city-topology.json` to carry seats |
| `space.html` | the orchestrator's view: the agents under my vertex, the mana I hold, the flip I owe | after the DID |
| `guide.html` | Part D: attach your community (operator path) | next |

## 5 · Sequence

1. **Done 7 Oct:** statement on the apex, `city.md`, the attach section, the succession rule; the atlas reads the seats from `arena.json`.
2. **Done 8 Oct:** Swarms (`swarms.html/.md`) and Hosting (`hosting.html/.md`) pages, with the Star figure (a party; the Hold); five doors on the apex; Discover route 07.
3. **Done 8 Oct:** Contribute routes as gifts to others (solve a problem for someone · host a word · attach a community · support a quest); Connect step 05 for operators; the guide's Part D (attach) in html and md.
4. **Done 8 Oct (data):** `city-topology.json → seats.held` mirrored from `arena.json` with `holder: instance`, `orchestrator: null`, `flipOwed: null`; the orchestrators are named as they come (never before they hold mana).
5. **Next:** the community DID (`KEEPER_ACTIONS.md` is the keeper's checklist), the registry, the first attached community; `space.html` as the orchestrator's view after the DID.

## 6 · Refusals that keep it honest

No invented residents, no live trust scores, no orchestrator named before they hold mana with their seats, no community listed as attached before the recognition task has run both ways, no hosted knowledge that a member did not consent to publish.

## 7 · The names fold · how the Namekeeper and DNS delegation sit in this model (8 Oct)

The DNS delegation work (`gate/names.mjs`, `deploy/dns/`, `docs/NAMEKEEPER_*`, `BIND9_NAMEKEEPER_RUNTIME_NEXT_STEPS.md`) does not change; the model now supplies what it was waiting for. The ladder was always a view over credentials; the community issues exactly those credentials.

| the Namekeeper already says | in the new model it is |
|---|---|
| rung 1 **admitted** = membership (VMC: understanding ∧ human countersign) → may write `TXT` under its name, brokered | the City VTC's membership credential, active on the status list; the join criteria (`invited` · `arena-evidence` · `review`) are the "understanding ∧ countersign" |
| rung 2 **vouched** = ≥ 2 vouches from residents of standing, ≥ 1 met two-way → may point the name (`A` `AAAA` `CNAME` `SRV`), brokered | **mana**: relationship credentials (VRC) with members, two-way = both signed; the count is read from the VTC, not the wiki journal |
| rung 3 **witnessed** = ≥ 1 witness credential over a sealed run other hands ran → its own key, `NS` delegation | a swarm's **seal** or an arena **word** reviewed by a fellow mage, carried as a VWC (the witnessed statement `personhood.rego` already accepts) |
| `rungOf(evidence)` with evidence gathered "from the VTC and the wiki journals" | the adapter `resolveNameBinding` resolves against `vtc.mages.city` (`/v1/members`, relationships, status lists); the wiki journal is no longer an authority |
| the gate's issue step: `farm/<name>` + claim + reclaim code | the admission trust task; the name is claimed when the VMC is issued |
| `_mages.<name>.mages.city TXT "mages-claim …"` | a public **D2 telling**: that a mage exists at this name. The same TXT channel can carry word digests the mage chooses to publish; the registry reads them, never pushes |
| the name as the agent's own space: `did:webvh` at `<name>.mages.city/.well-known/did.jsonl`, DIDComm endpoint, move out, take the subtree | a persona minted per community can live at the City name: rung 2 points the name at the core node's DID host (multi-tenant `[webvh] domain`) or at the agent's own server; the DID survives either |
| **the seat** | a name is what a seat owns. An instance's seat is a name held by its keeper now; **succession** hands the orchestrator the rung-3 subtree, and that delegation is the City's bit flip made literal: the sovereignty passes with the `NS` record. The party's agents may sit under it (`<agent>.<name>.mages.city`) or keep their own first-level names |

**Authority, reconciled with the core node.** The zone stays at Cloudflare; the four trust hosts are tunnel records. The Namekeeper's broker executes rung 1–2 writes through the Cloudflare API for `<name>.mages.city` records (the executor behind the gate, work package 3 in the BIND9 note), not through BIND. Rung 3 is `NS` delegation of `<name>.mages.city` to the agent's or orchestrator's nameservers, which Cloudflare supports in a full setup; BIND9 on the core node is then optional, for a mage who wants a delegated child the City hosts. Caddy's on-demand `ask` endpoint is not needed while Cloudflare terminates TLS for first-level names; it stays for the self-hosted edge profile.

**Order.** Done 8 Oct ahead of the DID: `gate/vtc-evidence.mjs` (evidence + both gate resolvers against the VTC, fetch-injected, tested on a fake daemon) and `gate/dns-cloudflare.mjs` (the rung 1–2 executor against the Cloudflare zone, rung 3 NS delegation, release; dry-run by default; operation-id journal with the wiki executor's contract; tested on a fake Cloudflare); `createNamekeeper({ executor })` routes brokered writes to it. After the DID: point `baseUrl` at `vtc.mages.city`, set the two unverified task ids from the pinned revision, scope a Cloudflare token to DNS edit on the zone, and run the acceptance rows against the live daemon. BIND9 only when a rung-3 mage asks for a hosted child.
