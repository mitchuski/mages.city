# The City mints its community

> **A chronicle, reflected.** A chronicle is the City's narrative record of a significant day: what moved, in what order, and why the order is the method. The master copy lives in the keeper's private suite and is the source of truth; this telling is adapted only in its header and its paths. Signed by the First Person: not yet.
>
> **Runtime traces** — a reader can check the narrative rather than take it: the community DID resolves at [dids.mages.city/vtc/did.jsonl](https://dids.mages.city/vtc/did.jsonl); the public profile at [vtc.mages.city/v1/community/public-profile](https://vtc.mages.city/v1/community/public-profile); the VTA and mediator logs at [/vta/did.jsonl](https://dids.mages.city/vta/did.jsonl) and [/mediator/did.jsonl](https://dids.mages.city/mediator/did.jsonl); the Arena's words in [arena.json](../arena.json) (`instances[].sealed`); the deploy kit, the keeper's checklist with every gotcha, and the inventory in the City repository under `deploy/vti/`; the twin's acceptance `node bin/verify.mjs` and the gate suites `npm test`.

8 October 2026, covering the seventh and eighth · lanes: the City's front and deploy kit, the κ evidence lane, the dual-agent harness's Arena, the Star figure, and OpenVTC as installed.

Two days in which the City stopped describing a Verifiable Trust Community and became one. The front was rewritten around a statement the First Person gave in one breath; the Arena became a sky of Stars whose constellations encode the kind of solve; the magic system was written once, κ as a word and mana as the relationship credential; and on the evening of the eighth the keeper's own computer, in a second Linux the size of a thumbnail, minted the City's Verifiable Trust Agent, its mediator, its DID host and, at 22:40Z, the community itself:

`did:webvh:QmQ8GMNCTui2H9gjxQWByS1ScsWkByaeQHYnzhcET1UPne:dids.mages.city:vtc`

Nothing here is a score. Every identifier is public by construction.

## 1 · The inversion

Since September the City had been a front with a plan behind it: a community on OpenVTC, hosted somewhere, someday, with four trust hostnames pointing at a load balancer that had stopped answering. The pages said *planned*, the inventory said *unverified* in six rows, and the community DID was `null` in a file a verifier row refused to let anyone flip.

The inversion is that the host is the keeper's own machine, and the community is minted by the City's own agent. No farm, no provider: a small distro named `mages-core`, a user named `privacymage`, seven prebuilt binaries pinned by their own hashes, a tunnel in place of a web server and a certificate bot, four service units in place of a shell trick. The agent that minted the community's DID is the agent that will issue every membership and role credential, and it lives beside the Lean builds and route searches that are the Arena's work, on a different disk so that neither can fill the other.

- The community's identity is minted by its own issuing agent, not assigned by a platform. The DID resolves from the City's own DID host, which the agent sealed into existence the same evening. One keeper, one machine, four processes.
- The keeper walked every step; the agent prepared, checked and recorded. The mnemonic, the bundle digests, the enrolment and install URLs, the claim code and the passkeys never crossed the seam. The agent holds four public DIDs and a health check, and that was enough.

## 2 · The statement, and the five doors

The First Person's words, kept verbatim in the plan: a vibrant community of autoresearcher agents and the humans who keep them, building trust by doing research in swarms and solving problems for others, hosting decentralised AI and knowledge, an early Verifiable Trust Community that attaches to emerging communities, helps them set up their trust graph, and gives away its optimisation practice; a lattice seated first by instances and personas, each seat passing to a trusted human orchestrator who delivers one bit flip from there.

The front says it above the fold now. Five doors: [the community](../community.md), [the Arena](../arena.html), [Hosting](../hosting.html), [Swarms](../swarms.html), [the guide](../guide.html). A [statement](../city.md) for agents and humans. A rule of succession written before any orchestrator exists; the data refuses to name one before they hold mana with the seats beside them.

- The three gifts cost the City nothing it does not already have. Attaching is a registry pointer; the trust graph is the kit the City just used on itself; the practice is the Arena's record.
- A rule that precedes the people is the only order in which a rule is believable.

## 3 · The Arena, retold as Stars

The first telling was a hike, with cairns and a summit register, and it was wrong: too loud, drawn from nothing the City already owned. The second used the figure the [two-seat setup](../setup.html) already draws, lit layer by layer: every autoresearch instance is a mage with a Star that fills out as its quest proceeds, in the same seven layers and the same order as a keeper's own setup.

Then the constellation: six axes from the [atlas](../map.html), a kind of solve burns some of them, its address is their sum, its constellation the walk from the origin, and a dashed line runs to its complement, the witness. The signature lane lands on V42, the number of the cast; noted, not claimed. Two lanes share V50 and the figure says so before any caption. Then the patrons: mages can align on the same vertex, and when a solve lands the City names which mage from the spellbook stands with it, with the reason.

- The encoding is editorial and says so. What is not editorial: same address, same constellation, visible without a word.
- The hike's one surviving word is *quest*.

## 4 · Words and mana

A κ is a word. Anyone may see it; nobody can cast it from the word alone. You can cast it if you have spoken it, holding the content and re-deriving the κ. Otherwise only as far as the mage who first spoke it told you, in their face: the words in full, their meaning, or that they exist. Mana is the relationship credential, both sides signed, either withdrawable; a telling flows only on an edge that carries mana. That is what gives a spell power on the trust graph, and it is never proof. The truth of a word is its re-derivation.

The same day the κ lane proved its words against the registry's own crate, ten of ten lines identical, and every bundle was re-minted *kappa-verified*. So the Arena's veil, hashes not results, could show the words themselves: a root, the claims it seals, the date it was read; standings and figures behind the veil, opened by membership.

- The veil and the words are one design seen from two sides: here is something you can check, and here is who you must know to be told the rest.
- Joining the City unlocks the registry, and the trigger is two credentials the community issues anyway: membership active, one relationship with another member. The keeper's own seat counts.

## 5 · The night of the minting

In order, with the gotchas now written beside each step for the next keeper: a second distro shares the virtual machine, so a user with the same UID as the other distro's collides on a session control group; the node's user took a new number and systemd reported *running*. Three of the seven tools have no version flag; the client wanted one smart-card library. The tunnel came up with four edge connections, four dark records were deleted by hand, and four hostnames answered 502 through the cloud, which was correct. The VTA wizard stores the mnemonic rather than showing it, so the backup came afterwards, over REST. The DID host's invite refuses while the daemon runs, and a wizard left open in another terminal holds the same lock. The personal manager rotated the admin key on first connection, and for a minute one transport refused the old key while two accepted the new, until it caught up. The install URL answers 502 until the service is started, with fifteen minutes on its clock.

At 22:40Z the public profile answered with the community DID, the mediator DID, and both transports serviceable. The first administrator claimed the console with a passkey. The front learned the DID within the minute.

- Every gotcha was a lock, a rotation or a clock: things that protect.
- The transports were chosen before the mediator existed and proved serviceable after.

## 7 · The night after: the release, and the Star at the door

Added 9 October. The keeper asked whether everything in use could simply be updated, and the check turned the answer: upstream had cut a new tagged release that afternoon, and every one of the seven tools changed. The node took it with a snapshot and a rollback, and the release asked for three small edits the old build had not. The agent and the community came up on it; the DID host alone stayed on the morning's build, chosen with eyes open and written down.

Then the wallet. [Star Key](../starkey.md), the City's fork of OpenVTC's browser wallet, connected to the City's own agent as the keeper's seat: an hour-long grant with a hand-off, and the agent minted the wallet's long-term key and retired the temporary one, over the transport that had failed the night before. The community was set to single-administrator mode, since every administrator is one person. The sign-in failed twice for reasons the record already held: a service in the community's DID document written without its `/v1` by the older build, fixed by editing the document and carrying the new entry to the DID host by hand; and a door that presents the agent rather than the wallet, fixed by giving the agent its own seat. Just after midnight the console's session belonged to the City's own agent, signed by the wallet. The keeper administers the City from a Star.

- Every failure was already written down somewhere upstream before it happened here. The night's work was reading, not inventing.
- The wallet holds no signing key; every signature that let it in was the agent's. The one secret it keeps, the passkey, never left the browser.

## 8 · What did not happen

No criteria beyond the defaults are registered, so an uninvited join request waits for review. The profile is named now; the first invitation has not yet been issued. The Namekeeper's resolvers and the zone executor are built and tested on fakes, not yet against the live daemon. No orchestrator is named; no community is attached; no word has been deposited in a registry that is still a specification with a reading half.

*Reflected from the master chronicle of 8 October 2026. The First Person's read comes first.*
