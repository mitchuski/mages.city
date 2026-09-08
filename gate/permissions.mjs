// VTA-facing permission boundary for a resident's FedWiki and DNS space.
// Adapters are server-owned functions, never values from a request body.
// No credential parser, issuer trust, signature validation or live provisioning
// is fabricated here: absent adapters deny. Return a scoped execution plan only.
import crypto from 'node:crypto';
import { NAME_RULE, FIXED_HOSTS, castNames, RUNGS } from './names.mjs';

const ACTIONS = new Set(['wiki:provision', 'wiki:write', 'dns:write', 'dns:delegate']);
const digest = value => 'sha256:' + crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const denied = reason => ({ allowed: false, reason, execution: 'not-applied' });

export function createPermissionGate({ verifyRequest, resolveEntitlement, resolveNameBinding, executors = {}, zone = 'mages.city', reserved = castNames(), now = () => Date.now() } = {}) {
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]*$/.test(zone)) throw Error('invalid City DNS zone');
  const fixedNames = new Set(FIXED_HOSTS);
  const reservedNames = new Set(reserved);
  const gate = {
    async authorize(request) {
      if (typeof verifyRequest !== 'function' || typeof resolveEntitlement !== 'function') return denied('VTA authentication and entitlement adapters are not connected');
      if (!request || typeof request !== 'object' || !ACTIONS.has(request.action)) return denied('unknown space action');
      // Select exactly the fields the authentication adapter must bind to its
      // proof/nonce/audience. Extra JSON fields cannot expand a permission.
      const name = request.name;
      if (typeof name !== 'string' || !NAME_RULE.test(name) || name.endsWith('-') || /^\d+$/.test(name) || fixedNames.has(name)) return denied('invalid or infrastructure City name');
      const needsBinding = reservedNames.has(name);
      if (needsBinding && (!request.action.startsWith('wiki:') || typeof resolveNameBinding !== 'function')) return denied('reserved City name requires a verified wiki binding');
      const resource = `${name}.${zone}`;
      const operation = { action: request.action, resource };
      if (request.action === 'dns:write') {
        const type = request.record?.type;
        const sub = request.record?.sub ?? '';
        if (!['TXT', 'A', 'AAAA', 'CNAME', 'SRV'].includes(type)) return denied('unsupported brokered DNS type');
        if (typeof sub !== 'string' || sub.length > 180 || (sub && !sub.split('.').every(s => /^[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?$/.test(s)))) return denied('DNS owner must stay in the resident subtree');
        const owner = sub ? `${sub}.${resource}` : resource;
        if (owner.length > 253) return denied('DNS owner too long');
        const ttl = request.record?.ttl ?? 300;
        if (!Number.isInteger(ttl) || ttl < 60 || ttl > 86400) return denied('TTL outside 60–86400 seconds');
        const value = request.record?.value;
        if (typeof value !== 'string' || !value.length || value.length > 1024 || /[\r\n\x00-\x1f\x7f]/.test(value)) return denied('invalid DNS record value');
        operation.record = { owner, type, value, ttl };
      }
      if (request.action === 'wiki:write') {
        if (typeof request.page !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(request.page) || request.page.length > 120) return denied('invalid wiki page slug');
        if (typeof request.contentDigest !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(request.contentDigest)) return denied('wiki write must bind the content digest');
        if (typeof request.operationId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{15,127}$/.test(request.operationId)) return denied('wiki write requires an operation ID of 16–128 safe characters');
        if (request.expectedRevision !== null && (typeof request.expectedRevision !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(request.expectedRevision))) return denied('wiki write requires an expected revision digest or explicit null for creation');
        operation.page = request.page; operation.contentDigest = request.contentDigest;
        operation.operationId = request.operationId; operation.expectedRevision = request.expectedRevision;
      }
      let identity, entitlement, binding;
      try {
        // Must authenticate the exact operation with a fresh, audience-bound
        // proof and protect replay at the execution boundary. A signed old key
        // record or a browser-supplied subject is not enough.
        identity = await verifyRequest({ operation: structuredClone(operation), authorization: request.authorization });
        if (!identity || identity.authenticated !== true || identity.fresh !== true || typeof identity.subject !== 'string' || !identity.subject.startsWith('did:')) return denied('fresh authenticated requester required');
        // Reserved cast names are assigned by host policy, never claimed from
        // request JSON. The binding does not replace the VTA action grant.
        if (needsBinding) binding = await resolveNameBinding({ name, resource, subject: identity.subject });
        // Resolves status/revocation and local issuer policy from authoritative
        // sources. Never implement this by echoing request.evidence or its rung.
        entitlement = await resolveEntitlement({ subject: identity.subject, resource });
      } catch { return denied('authentication or entitlement verification unavailable'); }
      const time = now();
      if (!Number.isFinite(time)) return denied('verification clock unavailable');
      if (needsBinding) {
        const b = binding;
        if (!b || b.verified !== true || b.status !== 'active' || b.name !== name || b.resource !== resource || b.subject !== identity.subject) return denied('active verified reserved-name binding required');
        if (typeof b.id !== 'string' || !b.id || typeof b.evidenceDigest !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(b.evidenceDigest)) return denied('name binding evidence reference required');
        const from = Date.parse(b.validFrom), until = Date.parse(b.validUntil);
        if (!Number.isFinite(from) || !Number.isFinite(until) || from > time || until <= time) return denied('name binding expired or not yet valid');
      }
      const e = entitlement;
      if (!e || e.verified !== true || e.status !== 'active' || e.subject !== identity.subject || e.resource !== resource) return denied('active verified entitlement for this requester and space required');
      if (typeof e.id !== 'string' || !e.id || typeof e.evidenceDigest !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(e.evidenceDigest)) return denied('entitlement evidence reference required');
      const start = Date.parse(e.validFrom), end = Date.parse(e.validUntil);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start > time || end <= time) return denied('entitlement expired or not yet valid');
      if (!Number.isInteger(e.rung) || e.rung < 1 || e.rung > 3) return denied('no resident permission');
      // Explicit grants remain necessary even with a high rung.
      const scope = operation.action === 'dns:write' ? `dns:${operation.record.type}` : operation.action;
      if (!Array.isArray(e.scopes) || !e.scopes.includes(scope)) return denied('action is outside the entitlement scope');
      if (operation.action === 'dns:write' && e.rung < 3 && !RUNGS[e.rung].types.includes(operation.record.type)) return denied('DNS record exceeds current rung');
      if (operation.action === 'dns:delegate' && e.rung < 3) return denied('subtree delegation requires witnessed standing');
      return {
        allowed: true, execution: 'not-applied', subject: identity.subject, resource,
        operation, operationDigest: digest(operation), entitlement: { id: e.id, evidenceDigest: e.evidenceDigest, validUntil: e.validUntil },
        ...(needsBinding ? { nameBinding: { id: binding.id, evidenceDigest: binding.evidenceDigest, validUntil: binding.validUntil } } : {}),
        enforcement: operation.action.startsWith('wiki:')
          ? { service: 'fedwiki', site: resource, owner: identity.subject, crossSiteWrite: false }
          : operation.action === 'dns:delegate'
            ? { service: 'bind9', keyName: resource + '.', rule: 'selfsub', subtree: resource, secretDelivery: 'holder-bound-sealed-channel' }
            : { service: 'namekeeper', mode: 'broker', subtree: resource },
      };
    },
    async execute(request, { body } = {}) {
      // Re-authorize on every execution. A serialized preview plan is never a
      // capability: callers cannot bypass fresh status by replaying that plan.
      let input;
      try { input = structuredClone(request); } catch { return denied('invalid request'); }
      if (input?.action === 'wiki:write') {
        if (typeof body !== 'string' || Buffer.byteLength(body, 'utf8') > 1024 * 1024) return denied('wiki body must be at most 1 MiB of UTF-8 text');
        const actual = 'sha256:' + crypto.createHash('sha256').update(body, 'utf8').digest('hex');
        if (actual !== input.contentDigest) return denied('wiki content differs from the authorized digest');
      }
      const plan = await gate.authorize(input);
      if (!plan.allowed) return plan;
      const executor = executors[plan.operation.action];
      if (typeof executor !== 'function') return { ...plan, allowed: false, reason: 'resource executor is not connected' };
      try {
        // Executor must consume request nonce/idempotency, recheck entitlement
        // at commit where required, and return durable receipt only after effect.
        // Credentials, reclaim tokens and TSIG secrets must use sealed delivery,
        // never a return value from this public boundary.
        const outcome = await executor({ plan: structuredClone(plan), authorization: input.authorization, ...(input.action === 'wiki:write' ? { body } : {}) });
        // Only explicit no-effect outcomes are safe to report as not applied.
        // Exceptions or malformed replies remain ambiguous and need reconciliation.
        if (plan.operation.action === 'wiki:write' && outcome?.applied === false && ['revision-conflict', 'operation-id-conflict', 'authorization-rejected'].includes(outcome.code)) return { ...plan, execution: 'not-applied', code: outcome.code, reason: 'wiki executor refused the commit' };
        if (outcome?.applied !== true || typeof outcome.receiptId !== 'string' || !outcome.receiptId) return { ...plan, execution: 'unconfirmed', reason: 'executor returned no durable receipt' };
        return { ...plan, execution: 'applied', receiptId: outcome.receiptId };
      } catch {
        return { ...plan, execution: 'unconfirmed', reason: 'executor outcome unknown; reconcile before retrying' };
      }
    },
  };
  return gate;
}
