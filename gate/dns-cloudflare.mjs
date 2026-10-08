// gate/dns-cloudflare.mjs — the Namekeeper's executor for rungs 1 and 2 when the zone lives at
// Cloudflare (it does: deploy/dns/RECORDS_2026-10-07_core-node.md). A brokered write under
// <name>.<zone> becomes one Cloudflare DNS API call; rung 3 is NS delegation of <name>.<zone>.
//
// Dry-run unless `apply: true` (or NAMES_APPLY=1): the planned request is returned, nothing is sent.
// Every call takes an operationId and journals {operationId, digest, result}; a repeat with the same
// digest returns the first result, a repeat with a different digest is refused (operation-id-conflict)
// — the same contract the wiki executor keeps (docs/NAMEKEEPER_WRITE_CONTRACT.md).
//
// The API token is read only through `token()` and never journaled. Scope it to DNS edit on this zone.
import crypto from 'node:crypto';
import { typeAllowed, RUNGS } from './names.mjs';

const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : (v && typeof v === 'object') ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v);
const NAME_RULE = /^[a-z0-9][a-z0-9-]{1,31}$/;
const SUB_RULE = /^[a-z0-9_][a-z0-9_.-]{0,62}$/;
const BROKERED = ['TXT', 'A', 'AAAA', 'CNAME', 'SRV'];

export function createCloudflareExecutor({ zoneId, zoneName = 'mages.city', token = async () => null, fetch: fetchFn = globalThis.fetch, apply = process.env.NAMES_APPLY === '1', api = 'https://api.cloudflare.com/client/v4', journal = [], now = () => Date.now(), protect = ['vta', 'vtc', 'mediator', 'dids', 'wiki', 'portal', 'swarm', 'exchange', 'gate', 'www', 'kappa'] } = {}) {
  if (!zoneId) throw new Error('zoneId is required');
  const seen = new Map(journal.map(j => [j.operationId, j]));

  async function cf(method, path, body) {
    const tok = await token();
    if (!tok) throw new Error('no API token available');
    const r = await fetchFn(`${api}/zones/${zoneId}${path}`, { method, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.success === false) throw new Error(`cloudflare ${method} ${path}: ${r.status} ${JSON.stringify(j.errors || j).slice(0, 200)}`);
    return j.result;
  }

  function labelOf(name, sub) {
    const n = String(name || '').toLowerCase();
    if (!NAME_RULE.test(n)) return { error: 'name: 2–32 chars, [a-z0-9-], starting alphanumeric' };
    if (protect.includes(n)) return { error: `'${n}' is a fixed host of the City; not an agent name` };
    const s = sub ? String(sub).toLowerCase() : '';
    if (s && !SUB_RULE.test(s)) return { error: 'sub: a label or dotted labels under your name' };
    return { label: s ? `${s}.${n}.${zoneName}` : `${n}.${zoneName}`, name: n };
  }

  function record(desired) {
    const t = String(desired.type || '').toUpperCase();
    if (t === 'SRV') {
      const [priority, weight, port, target] = String(desired.value).trim().split(/\s+/);
      return { type: 'SRV', name: desired.label, ttl: desired.ttl, data: { priority: Number(priority), weight: Number(weight), port: Number(port), target } };
    }
    return { type: t, name: desired.label, ttl: desired.ttl, content: t === 'TXT' ? String(desired.value).replace(/"/g, '') : String(desired.value), ...(t === 'CNAME' || t === 'A' || t === 'AAAA' ? { proxied: false } : {}) };
  }

  function remember(operationId, digest, result) { const j = { operationId, digest, result, at: new Date(now()).toISOString() }; journal.push(j); seen.set(operationId, j); return result; }
  function replay(operationId, digest) {
    const prior = seen.get(operationId);
    if (!prior) return null;
    return prior.digest === digest ? prior.result : { applied: false, code: 'operation-id-conflict' };
  }

  // A brokered record under the agent's name, allowed per rung. Dry-run returns the plan.
  async function execute({ name, rung, type, value, sub = '', ttl = 300, operationId }) {
    if (typeof operationId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{15,127}$/.test(operationId)) return { applied: false, code: 'operation-id-required' };
    const t = String(type || '').toUpperCase();
    if (!BROKERED.includes(t)) return { applied: false, code: 'type-not-brokered', why: `brokered writes cover ${BROKERED.join(' ')}; ${t} needs your own delegation at rung 3` };
    if (!typeAllowed(rung, t)) return { applied: false, code: 'rung-too-low', why: `rung ${rung} (${RUNGS[rung]?.name}) may write ${RUNGS[rung]?.types.join(' ')} only` };
    const lab = labelOf(name, sub); if (lab.error) return { applied: false, code: 'label-invalid', why: lab.error };
    const desired = { label: lab.label, type: t, value: String(value), ttl: Number(ttl) || 300 };
    const digest = 'sha256:' + sha(canon(desired));
    const prior = replay(operationId, digest); if (prior) return prior;
    const body = record(desired);
    if (!apply) return remember(operationId, digest, { applied: false, dryRun: true, code: 'dry-run', plan: { method: 'POST-or-PATCH', path: `/dns_records?name=${desired.label}&type=${t}`, body }, digest });
    const existing = await cf('GET', `/dns_records?name=${encodeURIComponent(desired.label)}&type=${t}`);
    const same = (existing || []).find(e => (t === 'SRV' ? canon(e.data) === canon(body.data) : e.content === body.content) && e.ttl === body.ttl);
    if (same) return remember(operationId, digest, { applied: false, code: 'already-applied', id: same.id, digest });
    let res;
    if (t !== 'TXT' && existing && existing.length) res = await cf('PATCH', `/dns_records/${existing[0].id}`, body);   // one A/AAAA/CNAME/SRV per label: replace
    else res = await cf('POST', '/dns_records', body);
    return remember(operationId, digest, { applied: true, id: res?.id || null, digest, record: desired });
  }

  // Rung 3: delegate <name>.<zone> to the agent's or orchestrator's nameservers. Cloudflare answers the
  // delegation and stops answering below it; this is the sovereignty handed over, and it does not lapse
  // with a credential — revoking it is `release`, an explicit act.
  async function delegate({ name, rung, nameservers = [], operationId }) {
    if (typeof operationId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{15,127}$/.test(operationId)) return { applied: false, code: 'operation-id-required' };
    if (!typeAllowed(rung, 'NS')) return { applied: false, code: 'rung-too-low', why: 'NS delegation needs rung 3 (witnessed)' };
    const lab = labelOf(name, ''); if (lab.error) return { applied: false, code: 'label-invalid', why: lab.error };
    const ns = nameservers.map(s => String(s).toLowerCase().replace(/\.$/, '')).filter(s => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(s));
    if (ns.length < 2) return { applied: false, code: 'nameservers-required', why: 'two or more nameservers' };
    const desired = { label: lab.label, type: 'NS', nameservers: ns.sort() };
    const digest = 'sha256:' + sha(canon(desired));
    const prior = replay(operationId, digest); if (prior) return prior;
    const plan = ns.map(target => ({ type: 'NS', name: desired.label, content: target, ttl: 3600 }));
    if (!apply) return remember(operationId, digest, { applied: false, dryRun: true, code: 'dry-run', plan, digest });
    const ids = []; for (const body of plan) ids.push((await cf('POST', '/dns_records', body))?.id || null);
    return remember(operationId, digest, { applied: true, ids, digest, delegation: desired });
  }

  // release: remove every record the broker wrote under the name (and any NS delegation). History stays in the journal.
  async function release({ name, operationId, reason = '' }) {
    if (typeof operationId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{15,127}$/.test(operationId)) return { applied: false, code: 'operation-id-required' };
    const lab = labelOf(name, ''); if (lab.error) return { applied: false, code: 'label-invalid', why: lab.error };
    const digest = 'sha256:' + sha(canon({ release: lab.label, reason: String(reason).slice(0, 280) }));
    const prior = replay(operationId, digest); if (prior) return prior;
    if (!apply) return remember(operationId, digest, { applied: false, dryRun: true, code: 'dry-run', plan: { method: 'DELETE', path: `/dns_records?name=${lab.label} and *.${lab.label}` }, digest });
    const all = await cf('GET', `/dns_records?per_page=500`);
    const mine = (all || []).filter(e => e.name === lab.label || e.name.endsWith('.' + lab.label));
    const ids = []; for (const e of mine) { await cf('DELETE', `/dns_records/${e.id}`); ids.push(e.id); }
    return remember(operationId, digest, { applied: true, removed: ids.length, ids, digest });
  }

  return { execute, delegate, release, journal, dryRun: !apply, zoneName };
}
