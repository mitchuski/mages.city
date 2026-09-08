# City Key journey intake

Built 7 September 2026. The City Key accumulates evidence references as its bearer explores AgentPrivacy. This first integration preserves originals, evolves the key, and exposes the same intake functions to agents and the City. It does not issue credentials.

## Components

- `agentprivacy-mcp/lib/journey.mjs`: shared implementation and validation.
- MCP tools `journey_start`, `journey_fold`, `journey_inspect`: available when the existing MCP process is next started. They make no network calls and hold no signing secrets.
- `mages_city/gate/journey.mjs`: City CLI adapter; defaults to the sibling `agentprivacy-mcp` repository. Override with `AGENTPRIVACY_MCP_DIR`.
- `spellweb/src/lib/proofPackets.ts`: stores intact `originalPacket` alongside its graph projection; `exportOriginalPackets()` reports older entries whose originals are unavailable. Re-import restores those originals.
- `spellweb/src/lib/cityKey.ts`: retains imported identity fields, including public key and future extensions, through folds.
- `agentprivacy_master/src/lib/city-key.ts`: additive `journey` field declaration.

## Two objects

The **City Key** holds `journey.version: 1` and ordered `steps`. Each step records its commitment, preceding key κ, and either a packet reference or an observed Trust Task reference. Status is always `recorded`, never `qualified` or `credentialed`. Unknown key fields, identity, walks, charts and descriptions survive. Each new step re-derives κ and sets `prior`; repeating an identical step is a no-op.

The **private journey bundle** (`kind: agentprivacy.journey-bundle/1`) holds the key, complete original `packets`, and original `taskDocuments`. Do not publish this bundle to the wiki, Portal, graph, or public repository. Some packets contain deliberately disclosed text; task documents may contain credentials or personal information. The bearer chooses what an agent receives. The key also contains linkable commitments and identifiers, so publication remains a separate choice.

An observed task's `documentCommitment` uses the City's existing Law-L5 hash over the full document. It is explicitly not the Trust Tasks framework's `taskDigestMultibase` or ceremony `stepDigest`, and its proof/schema/status are not verified by this intake implementation.

## Local workflow

Run from `mages_city`; paths below are your own private files. Existing output files are not overwritten, keeping the previous key recoverable.

```powershell
node gate/journey.mjs start --key city-key.json --packets packets.json --out journey-0.json
node gate/journey.mjs fold --bundle journey-0.json --packet new-packet.json --out journey-1.json
node gate/journey.mjs fold --bundle journey-1.json --task observed-task.json --out journey-2.json
node gate/journey.mjs inspect --bundle journey-2.json --record signed-key-record.json
```

`start --key` accepts the existing JSON/PNG key carriers. If the key already commits a packet root/count, supply all originals; silently resetting that root is rejected. `packets.json` may be an array or the `spellweb.bearer.packets` export. The key can also start without packets.

`inspect` reads the local master artefact catalog by default, or `--catalog` / `AGENTPRIVACY_ARTEFACT_CATALOG`. Catalog matching checks workshop, descriptor hash, district root, witness, ceremony, class and vertex. Choose/pin the catalog under operator control; a matching caller-invented catalog is not independent evidence.

## Checks and limits

Validation rejects changed κ, packet hash mismatch, wrong bearer key, graph-only packet projections, duplicate packet proofs, missing committed originals, conflicting task IDs, malformed journey steps and sealed packets with public body/facet fields. Original task documents are stored as observations, not treated as valid credentials. Recomputed hashes establish consistency, not the truth of a journey or its historical ordering.

The intake result reports packet integrity, descriptor consistency, bearer claims, and an optional signed key record check. A valid signed key record is not a fresh proof of control: the report explicitly leaves freshness unchecked. `issuanceAllowed` is always false.

The master profile and Spellweb game controls now carry the journey as described below. No public deployment, actual VTA identity, issuer ACL, credential status list, comprehension evaluator, fresh-holder challenge service, or credential delivery adapter was changed. Soulbis/Soulbae's live connection details are still needed. The existing City HTML changes were left intact.

## Browser game loop (2026-09-07)

1. Cast in a master workshop. The existing proof-packet store retains the cast. On the profile's **Export City Key** or **Carry private journey bundle**, these packets become recorded artefact steps. The master reading updates the carried head, preserving imported journey steps, unknown extensions, Spellweb charges, and originals.
2. Import the private bundle in Spellweb's Swordsman Key panel. Its originals also become graph artefacts. Strike the key as usual: the existing game charge tape and the journey commitments travel together.
3. Spellweb's craft packet import folds available originals into the active key. City Key and private bundle exports also fold pending originals, so a graph import before a key was struck can be carried later. Invalid or wrong-bearer evidence blocks the fold with an explanation; graph ingestion alone does not validate it.
4. Both surfaces accept versioned Trust Task JSON through the journey import control. A task document adds one recorded step, with exact retries ignored. It does not award mana, mark the task passed, issue a credential, or grant a wiki/DNS permission. A task claiming successful issuance remains an unverified document.
5. Bring the private bundle home through master's **Import journey / Trust Task**. Adoption replaces the local carried head. The next profile export combines current local achievements with that head. A valid JSON/PNG key returned through **Charge City Key** is retained when its committed originals are already present; missing originals require the private bundle. The existing local mana charging rules remain separate.

The browser bundle is stored under `agentprivacy:journey-bundle:v1` on each origin. It is local browser storage, not encrypted storage or a server backup. Only export it to a chosen recipient. Key-only exports carry commitments, while the private bundle also includes original artefacts and task documents. Native Spellweb keys still need the existing /star dressing journey before they qualify for master's charging format; no palette/descriptions are invented.

The browser core is generated from the MCP's validation/folding implementation by `agentprivacy-mcp/scripts/build-browser-journey.mjs`, with WebCrypto hashing. Regenerate with `npm run generate:journey-browser` from that repo; sibling repo paths are assumed, with `AGENTPRIVACY_SUITE_ROOT` as an optional override. Browser stores are kept identical and checked for drift by `npm run test:journey-browser` (requires sibling repos and Spellweb's installed TypeScript).

This integrates the profile carry/charge route, Spellweb craft intake, and Swordsman Key controls. Other master's standalone ceremony/model exports keep their existing behavior. Task evaluation, invitation acceptance and agent communication are not simulated. The next live step is to connect the deployed agents and their supported task versions to the City's existing fail-closed intake and permission adapters.

Validation: both projects pass TypeScript checks; the cross-browser module test covers master cast-store export → separate-origin bundle adoption → Spellweb strike → task import → master return, exact retries, stale heads, wrong identity, storage failure and Node/browser wire parity. Existing seven journey tests and Spellweb's original-packet round-trip check pass. UI rendering has not been exercised in a browser in this pass.

## Next integration contract

### Destination: permissioned FedWiki space and BIND9 subtree

The keeper clarified that permissioning a resident's space is the destination. `gate/permissions.mjs` now supplies the VTA-facing boundary, with `authorize` for a scoped preview and `execute` for a fresh authorization followed by a server-owned resource adapter. It is not attached to a public route or the existing keeper CLI.

Server-owned `verifyRequest` and `resolveEntitlement` adapters are mandatory. Neither the City Key nor request-supplied membership, rung or scope values supply authority. The resolver must validate issuer policy, credential status and the subject/resource binding. It returns a current evidence reference and explicit scopes; the existing Namekeeper ladder further limits DNS types.

Supported actions are `wiki:provision`, `wiki:write`, `dns:write` and `dns:delegate`. Wiki writes bind the page and exact UTF-8 content digest, remain within the authorized host, and grant no cross-site write. DNS updates stay within the resident subtree; a high rung still needs explicit action scope. Delegation names a TSIG key equal to the resident FQDN and a BIND `selfsub` rule. This follows [BIND's update-policy model](https://bind9.readthedocs.io/en/stable/reference.html), but the installed BIND configuration still requires host-side validation.

The executor adapters for FedWiki ownership/provisioning, brokered DNS updates and sealed TSIG delivery remain unconnected. They must consume replay/idempotency state, enforce ownership with the farm's actual authentication mechanism, validate DNS RDATA, and return a durable receipt only after applying the effect. `execute` re-authorizes instead of trusting an old preview, verifies actual wiki content, reports ambiguous effects as `unconfirmed`, and returns only a receipt identifier—not executor secrets. Missing adapters deny. No live farm directories, DNS records or TSIG keys were created.

Tests: `node --test bin/permissions.test.mjs` covers absent adapters, scoped own-site access, wrong subjects/resources, reserved names, expiry/revocation, DNS scope/rung limits, malformed owners/values, delegation boundaries, content substitution and uncertain executor outcomes.

Soulbis should receive only bearer-approved evidence and bind a fresh challenge to its subject, key κ, target operation and audience. Soulbae should evaluate the relevant invitation/reflection task against a versioned rubric, not infer comprehension from a hash. The City combines that result with the required sponsor/witness policy. A separately authorized issuer then issues the registered endorsement or invitation using the upstream task interfaces. Verify the deployed service supports the pinned task versions before sending anything.

Receiving an endorsement as a person remains distinct from admitting an agent or person as a City resident. This implementation changes neither membership policy nor credential subject.

## Verification

```powershell
node --test ../agentprivacy-mcp/test/journey.test.mjs
node ../agentprivacy-mcp/test/canon.test.mjs
node ../agentprivacy-mcp/test/bridge.test.mjs
# From spellweb:
node scripts/journey-roundtrip-check.mjs
node node_modules/typescript/bin/tsc --noEmit
```

The journey tests are included in the MCP package's normal test command. The City adapter uses the exact shared module, so the two intake surfaces do not maintain separate implementations.
