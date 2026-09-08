# city_mage: the City dual-agent harness instance

This project owns its instance of the current `dual-agent-harness` framework. The older `agentprivacy-dual-agent-harness` extraction is superseded. The instance is an integration baseline and resumable setup engine, not a connected pair of agents or a completed trust setup.

From the City repository:

```sh
node harness/city_mage/sync-entry-kit.mjs
node harness/city_mage/run.mjs
```

The source manifest is `runtime.json`; the entry kit gets an exact copy at `site/city-mage.json`. The runner checks this equality and reading links, invokes the existing local checks, pins source hashes before/after, records full stdout/stderr and calls the current framework's conformance gate. Dependencies are installed sibling repos; no remote mutation is attempted. Run IDs are unique; evidence is retained under `runs/<id>/`. `frontier.json` records numeric measurements before the run chronicle is written. No candidate is promoted and no paired improvement is claimed.

`setup.mjs` supplies `runSetup` with host-owned `adapters`, `verifyReceipt` and durable private `persist`. Storage must atomically compare `expectedRevision`, persist the next checkpoint and return its `revision`; a conflict stops the caller before any new effect. It does not load executable code, URLs or arbitrary handlers from a City Key. Context binds subject, audience and key commitment. A cached receipt is reverified on resume. Non-local effects need authorization of the exact intent. A persisted operation ID survives uncertainty; reconciliation is required before repeating an effect. Missing adapters, stale evidence and unresolved outcomes stop setup. The test verifier is explicitly a scheduler fixture, not a credential verifier.

Conformance checks config/frontier structure and framework invariants. It does not prove semantic correctness, privacy, cryptographic seat separation or live service availability. This primary-authored baseline has no independent held-out bank. Its paired prompt builders throw rather than silently substituting mocks. Before a paired run, assign real isolated seats and independently governed witnesses; implement actual prompt/schema and transport adapters.

## Operating local preparation

`bootstrap.mjs --help` describes the runnable local entry command. Supply an existing key or complete private journey bundle, an explicit subject reference and HTTPS audience, and a new instance directory under an existing private parent. The command imports the existing MCP carrier and evidence validators, preserves all original JSON fields, pins local kit sources, and initializes the checkpoint without claiming a completed live stage. The same arguments resume after checking source/evidence/context equality. It prints no key commitment, subject, private extensions or original evidence.

Prepared `journey.json`, `preparation.json` and `checkpoint.json` belong in private custody. Host adapters can use the prepared context and checkpoint with `runSetup`; receipt verification remains mandatory. These files are not a credential, session or public export. See `site/city-mage.md` for the operator command and handling of incomplete preparations.

### Local checkpoint storage

`checkpoint-store.mjs` now supplies the storage boundary for a host integration:

```js
const store = openCheckpointStore(hostOwnedAbsolutePrivatePath);
const result = await runSetup({
  context, checkpoint: store.load(), persist: store.persist,
  adapters, verifyReceipt,
});
```

Import `openCheckpointStore` from `./checkpoint-store.mjs` and `runSetup` from `./setup.mjs`. The host must select an existing private directory outside the public site, source repository and sync/export folders. Never derive the path from a key or visitor request. This module does not encrypt data, configure Windows ACLs or connect VTA memory. The host owns those controls.

An exclusive lock guards revision comparison and replacement across cooperating processes. File contents are flushed before a same-directory rename; power-loss durability of directory metadata remains filesystem-dependent. Readers see the previous or replacement record. Stale revisions, changed context, corrupt files and existing locks fail closed. A process crash may leave a lock or temporary file; retain it until an operator confirms the writer has stopped and inspects the committed checkpoint. Do not automatically delete locks or repeat uncertain effects. Resume through `runSetup`, which revalidates receipts and reconciles the saved operation ID. No credentials or authorization follow from possessing the file.

The baseline includes real filesystem tests for competing store instances, retained locks, corruption and setup reconciliation after reopening storage. The receipt verifier in these tests remains a scheduling fixture.

## The eventual experience

“Log in with Star” reuses the Soulbis key and existing orb implementations. Key-loaded means personalization. Verified identity, delegation and context authorization must come from the website service. A compact Star travels visually with the reader and expands to show context, status, evidence and limits. Colour alone never signals access. The website/orb binding is still unimplemented; this instance records and tests setup orchestration, not the renderer.

The next connection is the keeper's already deployed VTA: discover its supported interfaces and verify ownership before deciding whether any provisioning is needed. Then connect the existing identity, delegation, MyTerms/TSP, Trust Task/ceremony, City policy and scoped memory adapters in manifest order. Actual receipts belong in private custody; public chronicles contain only an approved account.

Source pointers are in `SOURCES.md`. The master chronicle owns the narrative source; per-run notes are operational evidence records, not public reflections or canonical tome bindings.
