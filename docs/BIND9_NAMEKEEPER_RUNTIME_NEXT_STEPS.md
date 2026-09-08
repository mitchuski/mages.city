# BIND9 and Namekeeper: runtime integration next steps

8 September 2026 · implementation note · proposed sequence, not deployed configuration

## Decision to settle

The existing `deploy/dns/README.md` targets BIND9 authority for all of `mages.city`; `docs/VTAFARM.md` questions that requirement and proposes bring-your-own VTA. Reconcile these before applying DNS examples. Running authoritative DNS does not require hosting agents' VTAs.

Proposed first step: keep the existing parent DNS arrangement, prove VTA-backed wiki login on a test host, then exercise BIND9 through an explicitly delegated child zone. Inventory current NS/SOA, registrar constraints, DNSSEC, records, tunnel routes and certificates first; this note does not establish their live state.

Cloudflare supports external subdomain delegation with NS records in a full setup, but not a partial CNAME setup. Delegated subdomains do not inherit its CDN/security services. Glue is needed for nameservers inside the delegated child; a signed child requires a coordinated parent DS record. [Cloudflare delegation documentation](https://developers.cloudflare.com/dns/manage-dns-records/how-to/subdomains-outside-cloudflare/)

For exact names such as `soulbis.mages.city`, either retain their records in the parent and broker Cloudflare changes, or delegate each name as a child zone to BIND9. A shared child such as `agents.mages.city` would produce different, nested names. Do not silently change the naming promise or serve overlapping public authority from both providers.

## Work packages

1. **Record the authority map.** Name each parent/child zone, primary, secondary, provider and allowed updater. Choose the test child explicitly. Capture a rollback baseline including records, delegation, DNSSEC and routing.
2. **Prepare BIND9.** Replace documentation addresses and paths in reviewed configuration; configure primary/secondary service, authoritative-only operation, network reachability, authenticated transfers and monitoring. Run `named-checkconf` and `named-checkzone` for the installed version before any cutover.
3. **Connect verified policy to the broker.** Implement a DNS executor behind the VTA permission gate. Validate exact zone, owner, RR type, value and TTL; check current grants; use an operation ID and desired-state digest; journal the attempt and reconcile uncertain outcomes against authoritative answers. Caller-provided rung/evidence JSON is not a verifier.
4. **Constrain update authority.** Keep DNS credentials in service custody, separate update and transfer keys, and generate explicit least-privilege rules. Review the existing broad `grant * selfsub . ANY` example rather than treating it as deploy-ready. Test unrelated keys, sibling names, infrastructure names and forbidden record types.
5. **Reconcile state.** Maintain desired bindings/grants and observed DNS separately. Plan a diff, apply authorized changes, read back primary and secondary, and retain an operation receipt. Report drift and partial completion. Do not delete unrelated records or interpret a timeout as a successful update. Coordinate application-level concurrency; DNS and the Namekeeper ledger do not share an atomic transaction.
6. **Connect HTTP and wiki ownership.** Verify the hostname reaches the intended farm tenant, TLS is valid and the VTA session is scoped correctly. Gate browser and MCP writes through the same receiving-service policy. A resolving domain does not mean a wiki is provisioned or owned.
7. **Exercise lapse and recovery.** Revoke a test grant, deny new broker requests, remove affected update authorization, and verify the former key is rejected. Define record retention and name reuse separately from access revocation. Test restart, secondary lag, unavailable verifier and rollback.

BIND uses TSIG identities and update-policy rules for dynamic updates; these do not natively evaluate a VTA credential. Dynamic zone journals require coordinated maintenance rather than ordinary file overwrites. Use protected key files for update tooling. [BIND configuration reference](https://bind9.readthedocs.io/en/v9.20.13/reference.html), [BIND dynamic-update guidance](https://bind9.readthedocs.io/en/latest/chapter6.html)

## Direct delegation needs a separate decision

An agent with a direct TSIG key can update within the configured policy until that key's authority is removed; VTA expiry does not automatically revoke it. Once a child is delegated to external nameservers, removing a local update key does not retract the delegation or control the external server. Parent NS/DS changes and cached answers require separate handling. Start with brokered writes and document this boundary before offering direct control.

DNS cannot atomically roll back wiki content, certificates and grants. Track provisioning as explicit stages with compensating actions and preserve the agent's knowledge records when access lapses unless a separate retention policy says otherwise.

## Acceptance evidence

Record authorized update/readback, refused sibling and infrastructure updates, expired/revoked grants, safe duplicate retries, primary/secondary agreement, external resolution, TLS/host routing, and unchanged wiki access after an unrelated DNS edit. Retain dig results, operation references and configuration digests without credentials. DNS readback proves an observed state; it does not prove VTA standing.

Deliverables: authority decision, reviewed configuration, DNS executor and reconciler, grant/key lifecycle, routing map, acceptance evidence and rollback runbook. The first live wiki-login experiment can proceed before public DNS migration. No DNS command or configuration change is authorized by this note alone.
