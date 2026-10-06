# Two seats — the Mages City setup, for an agent to walk with its keeper

You are helping a keeper set up two Verifiable Trust Agents (VTAs): **the Swordsman** (⚔️, the keeper's own) and **the Mage** (🧙, yours, the agent's). The visual version is `https://mages.city/setup.html`; each phase finished there draws part of a star.

## Rules for the agent

1. **One phase at a time.** Say what the phase is for in two sentences, show the commands, wait.
2. **Keeper steps are the keeper's.** Anything that creates a VTA, grants access, approves consent, deletes, or touches a passkey, mnemonic or private key: the keeper types it in their own terminal. You never ask to see a mnemonic, a private key or a passkey, and you never run those commands yourself.
3. **Check before claiming.** After each phase, ask for the output (for example `pnm -v <seat> health`) and read it. A phase is done when its "done when" line is true, not when the commands were typed.
4. **Read flags from the source of truth.** If `pnm <command> --help` disagrees with this page, the help wins; say so.
5. **Names.** Default seat names are `swordsman` (keeper) and `mage` (agent). Use the keeper's names if they give different ones. Below, `{S}` and `{M}` stand for them.

## Phase 1 — Bring your tools · keeper · draws the field

Install `pnm` (from the VTA farm, or built from OpenVTC's `verifiable-trust-infrastructure`) and the Star extension in Chrome (Developer mode → Load unpacked). The extension is the keeper's wallet and their door into the farm portal.

```
pnm --help
pnm vta list
```

Done when: `pnm vta list` answers and the Star extension shows its Setup star.

## Phase 2 — Seat the Swordsman · keeper · draws ⚔️ the Swordsman’s tetrahedron

```
pnm setup --name {S}
# farm portal: sign in with a passkey, create a VTA, paste the printed admin did:key at "Admin DID"
pnm setup continue {S} --vta-did <the new VTA DID>
pnm -v {S} health
pnm -v {S} backup export --help
```

Done when: health passes. Ask the keeper to record the DID, the key type and the date.

## Phase 3 — Seat the Mage · keeper · draws 🧙 the Mage’s tetrahedron

```
pnm setup --name {M}
# farm portal: create a second VTA with the new admin did:key
pnm setup continue {M} --vta-did <the Mage VTA DID>
pnm -v {M} health
```

The keeper stays the Mage VTA's operator. You, the agent, never receive the operator login. Done when: health passes on both seats.

## Phase 4 — Open the bridge · keeper, then agent · draws the routes

```
pnm -v {M} contexts create --id agent --name "Agent"
pnm -v {M} acl create --did <agent did:key> --role application --contexts agent --label vta-mcp --expires 30d
pnm -v {M} approvals approvers add swordsman <keeper's pnm or device did:key>
pnm -v {M} approvals require https://trusttasks.org/spec/keys/sign/0.1 --consent --set swordsman --context agent
pnm -v {M} approvals explain https://trusttasks.org/spec/keys/sign/0.1
```

Then connect the agent host to the Mage through `vta-mcp`, read-only first, with `--deny acl/*` always. Consent rules bind only when the Mage VTA runs with policy enforcement on; on a hosted farm the keeper asks the operator. Done when: you can read your VTA status, and a test signature waits for `pnm consent approve`.

## Phase 5 — Bind the seats · both · draws the core

A relationship credential between the two seats, held privately by both and never published. Two routes exist today: OpenVTC's relationship flow over pairwise DIDs, or the two-party record the Star Hold already verifies. Agree with the keeper how it ends: a short validity they renew, or a relationship they can delete. A presentation that hides which keeper the agent belongs to is specified, not built; do not claim it.

## Phase 6 — Keep it in the Hold, and test it · both · draws the Hold’s shell

Add the binding to the keeper's Hold, beside their City Key. Then the acceptance test: the keeper leaves a note in your VTA memory without telling you what it says, and you read it back through your own scoped bridge (`pnm -v {M} memory --help` shows the keeper's side). Do not guess the note; read it.

## Phase 7 — Reach another star · keeper · draws a line to a second star

Prepare an invitation for one other keeper: a pairwise relationship between agents, under terms both sides agree and either can withdraw. The keeper sends it.

---

This page holds no keys and runs no commands. The City keeps no custody.
