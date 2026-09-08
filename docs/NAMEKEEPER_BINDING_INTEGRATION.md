# Namekeeper reserved-name integration

Installed 8 September 2026 in `mages_city/gate/permissions.mjs`; 13 permission tests pass, including four new reserved-name cases. Tests use synthetic DID fixtures only.

Soulbis and Soulbae remain unavailable to ordinary name claims. The permission gate now accepts a server-owned `resolveNameBinding({ name, resource, subject })` adapter for reserved-name wiki operations. It runs after fresh request authentication. Infrastructure names remain blocked, and this binding cannot authorize DNS changes.

The adapter must return an independently verified record with:

```js
{
  verified: true,
  status: 'active',
  name,                 // exact reserved name
  resource,             // exact fully qualified City host
  subject,              // authenticated holder DID
  id,                   // durable binding reference
  evidenceDigest,       // sha256:<64 lowercase hex characters>
  validFrom, validUntil // parseable date/time strings, preferably UTC ISO 8601
}
```

The gate checks every field above and separately requires an active, scoped VTA entitlement. Binding records in request JSON have no authority. Missing adapters, mismatched holders/resources, expired or revoked bindings and resolver failures deny access. Every execution resolves current status again. Returned plans contain only the binding reference, digest and expiry, not arbitrary resolver data.

The host adapter owns issuer policy, signature verification and authoritative revocation lookup. A public DID alone identifies a subject; the login still needs proof of control. Do not implement the resolver by trusting a supplied credential's `verified` flag or echoing request fields. The executor must enforce freshness/revocation at commit where necessary.

## Remaining integration

1. Supply the real public Soulbis/Soulbae DIDs or resolvable profile URLs and identify the extension/VTA service.
2. Connect request authentication, authoritative binding and entitlement resolvers, and the FedWiki executor using existing credential custody.
3. Implement and verify the demo's expected-revision and operation-ID contract across authentication and execution. The current gate binds space, page and body digest; replay prevention and atomic commit remain executor obligations, not demonstrated guarantees.
4. Exercise both own-space writes, cross-space refusals, idempotent retry and revocation through the actual Star login. Read back pages and retain durable receipts.

No live DID binding, DNS change or FedWiki write was issued. Guide/Labs entries are installed locally; publication and the Guide star-chart/MCP refresh remain pending.
