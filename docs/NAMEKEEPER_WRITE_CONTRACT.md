# Namekeeper wiki-write contract

8 September 2026. The City gate now includes `operationId` and `expectedRevision` in the exact operation passed to request authentication and in its operation digest. Missing fields are rejected before authentication. This is a deliberate contract change: existing wiki-write callers must supply both fields.

- `operationId`: 16–128 ASCII letters, digits, underscores or hyphens, starting with a letter or digit. Generate a new unpredictable ID for each intended change; preserve it across retries of that change.
- `expectedRevision`: explicit `null` means create only if absent. Otherwise supply `sha256:<64 lowercase hex characters>` for the current page revision.
- `contentDigest`: SHA-256 of the exact UTF-8 body passed to execution, as before.

The receiving service must define the page revision representation and return its digest during reads. The local simulation hashes the exact stored body bytes; a live adapter must use a consistent authoritative representation and must not assume a FedWiki timestamp is this digest.

## Receiving-service obligations

Authenticate a fresh proof for the exact operation and audience on every attempt, including retries. An operation ID is an idempotency key, not proof of identity or a replacement for a login nonce.

Inside the commit boundary, check current authorization and atomically:

1. Look up the receipt by authenticated subject, exact space and operation ID.
2. If its operation digest matches, return the original receipt without another write. If it differs, refuse with `operation-id-conflict`.
3. Compare the authoritative page revision with `expectedRevision`; refuse a mismatch with `revision-conflict`.
4. Commit the page and durable receipt together. The receipt must survive restart and bind the subject, space, page, operation digest and resulting revision.

This requires a transaction or equivalent recoverable commit protocol across all writers. A process-local lock or a read followed by an unconditional HTTP write does not establish it. Revoked authorization must refuse even a retry; a separate authenticated reconciliation path can recover historical status.

Executors report a known refusal as `{ applied: false, code }`, where `code` is `revision-conflict`, `operation-id-conflict` or `authorization-rejected`. The gate returns `execution: not-applied` and that code. Such a reply is valid only when no effect occurred. Exceptions, unknown codes and missing receipts remain `unconfirmed`, requiring reconciliation before retry. Gate `allowed` describes authorization; clients must inspect `execution` to determine the result.

## Validation and limits

Run `node --test bin/permissions.test.mjs bin/namekeeper-flow.test.mjs` from the City repository: 17 tests pass.

The two-agent fixture checks own-space writes and readback, cross-space denial, receipt reuse, changed retries, concurrent creates, stale edits and revoked grants. It uses synthetic `did:example` identities and in-memory storage. It does not validate real signatures, service authentication, cross-process atomicity, restart recovery or a deployed FedWiki. Those are live-adapter acceptance requirements.

Actual Soulbis/Soulbae public DIDs, the intended extension/VTA endpoint and the receiving-service adapter remain needed for the live demo. No domain binding, DNS update or live wiki write was issued.
