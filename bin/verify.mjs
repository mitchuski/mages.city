#!/usr/bin/env node
// bin/verify.mjs — Phase 1 acceptance for the local twin. One command, every row must PASS.
//   node bin/verify.mjs
// Talks to 127.0.0.1 with a Host header (no hosts-file edit needed) and drives the front's
// own data module (site/data.js) through that same fetch, so what the front renders is what
// gets checked.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FARM = process.env.MAGES_FARM || path.join(ROOT, 'farm');
const TLD = process.env.MAGES_TLD || 'mages.localhost';
const FARM_PORT = Number(process.env.MAGES_FARM_PORT || 3333);
const FRONT_PORT = Number(process.env.MAGES_FRONT_PORT || 3334);
const PORTAL_PORT = Number(process.env.MAGES_PORTAL_PORT || 4445);
const WIKI = 'wiki.' + TLD, PORTAL = 'portal.' + TLD, SWARM = 'swarm.' + TLD, EXCHANGE = 'exchange.' + TLD;
const EXCHANGE_PORT = Number(process.env.MAGES_EXCHANGE_PORT || 4448);
const R = n => `${n}.${TLD}`;
const HOSTS = [WIKI, PORTAL, SWARM, EXCHANGE, R('soulbis'), R('soulbae'), R('systerrae')];

// fetch-shaped request to 127.0.0.1 with the URL's host as the Host header
function nodeFetch(url, opts = {}) {
  return new Promise(resolve => {
    const u = new URL(url);
    const data = opts.body ? Buffer.from(opts.body) : null;
    const r = http.request({ host: '127.0.0.1', port: Number(u.port || 80), path: u.pathname + u.search, method: opts.method || 'GET', headers: { Host: u.host, ...(opts.headers || {}), ...(data ? { 'Content-Length': data.length } : {}) }, timeout: 8000 }, res => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, headers: res.headers, text: async () => b, json: async () => JSON.parse(b) }));
    });
    r.on('error', e => resolve({ ok: false, status: 0, headers: {}, text: async () => String(e), json: async () => { throw e; } }));
    r.on('timeout', () => { r.destroy(); resolve({ ok: false, status: 0, headers: {}, text: async () => 'timeout', json: async () => { throw new Error('timeout'); } }); });
    if (data) r.write(data);
    r.end();
  });
}
async function req(host, port, p, method = 'GET', body = null, headers = {}) {
  const r = await nodeFetch(`http://${host}:${port}${p}`, { method, body: body ? JSON.stringify(body) : null, headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers } });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, text, json, headers: r.headers };
}
const farm = (host, p, ...rest) => req(host, FARM_PORT, p, ...rest);
const front = (p, ...rest) => req(TLD, FRONT_PORT, p, ...rest);
const portal = (p, ...rest) => req(PORTAL, PORTAL_PORT, p, ...rest);
const exchange = (p, ...rest) => req(EXCHANGE, EXCHANGE_PORT, p, ...rest);
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : (v && typeof v === 'object') ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v);
const slugOf = t => t.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();

const rows = [];
const check = (name, ok, detail = '') => { rows.push({ name, ok: !!ok, detail }); };

// 1 · the farm answers on every host
for (const h of HOSTS) {
  const r = await farm(h, '/system/sitemap.json');
  check(`farm answers ${h}`, r.status === 200 && Array.isArray(r.json), `${r.status} · ${Array.isArray(r.json) ? r.json.length + ' pages' : r.text.slice(0, 60)}`);
}

// 2 · a host with no directory is refused, not created (the --allowed '*' gate); the apex is not a wiki
{
  const ghost = 'nope.' + TLD;
  const r = await farm(ghost, '/welcome-visitors.json');
  const created = fs.existsSync(path.join(FARM, ghost));
  check(`ghost host refused, no dir created (${ghost})`, r.status !== 200 && !created, `status ${r.status} · dir ${created ? 'CREATED' : 'absent'}`);
  check('the apex is the front, not a wiki dir', !fs.existsSync(path.join(FARM, TLD)), fs.existsSync(path.join(FARM, TLD)) ? 'farm/' + TLD + ' still exists' : 'farm/' + TLD + ' absent');
}

// 3 · Hall pages + every link resolves (same site first, then the neighbourhood)
{
  const want = ['welcome-visitors', 'the-gate', 'the-roster', 'the-feed', 'the-districts', 'how-to-read-this-city'];
  const site = await farm(WIKI, '/system/sitemap.json');
  const slugs = new Set((site.json || []).map(p => p.slug));
  check('Hall carries its six pages', want.every(s => slugs.has(s)), want.filter(s => !slugs.has(s)).join(',') || 'all present');
  const hood = new Set();
  for (const h of HOSTS) for (const p of (await farm(h, '/system/sitemap.json')).json || []) hood.add(p.slug);
  let dead = [];
  for (const h of HOSTS) {
    const sm = await farm(h, '/system/sitemap.json');
    const have = new Set([...((sm.json || []).map(p => p.slug)), ...hood]);
    for (const p of sm.json || []) {
      const pg = await farm(h, `/${p.slug}.json`);
      for (const it of pg.json?.story || []) {
        if (it.type === 'tileglyph') { const m = it.text.match(/link:\s*(.+)$/m); if (m && !have.has(slugOf(m[1].trim()))) dead.push(`${h}/${p.slug} → ${slugOf(m[1].trim())}`); }
        if (it.type === 'markdown' || it.type === 'paragraph') for (const m of it.text.matchAll(/\[\[([^\]]+)\]\]/g)) { const s = slugOf(m[1]); if (!have.has(s) && (await farm(h, `/${s}.json`)).status !== 200) dead.push(`${h}/${p.slug} → ${s}`); }
        if (it.type === 'reference') { const rr = await farm(it.site, `/${it.slug}.json`); if (rr.status !== 200) dead.push(`${h}/${p.slug} ⇒ ${it.site}/${it.slug}`); }
      }
    }
  }
  check('every wiki link / tile / reference resolves', dead.length === 0, dead.slice(0, 5).join(' · ') || 'no dead links');
}

// 4 · assets + CORS on the wiki (the front reads it cross-origin)
{
  const r = await farm(WIKI, '/assets/skill.md');
  check('Hall serves assets/skill.md', r.status === 200 && /how an agent joins/i.test(r.text), `${r.status}`);
  const c = await farm(WIKI, '/the-roster.json', 'GET', null, { Origin: `http://${TLD}:${FRONT_PORT}` });
  check('wiki JSON carries a CORS header for the front', c.status === 200 && !!c.headers['access-control-allow-origin'], `Access-Control-Allow-Origin: ${c.headers['access-control-allow-origin'] || 'MISSING'}`);
}

// 5 · the front serves
{
  const i = await front('/');
  check('front serves index.html', i.status === 200 && /mages\.city/.test(i.text) && /data\.js/.test(i.text), `${i.status}`);
  const b = await front('/board');
  check('front serves /board as board.html (auto-trailing-slash rule)', b.status === 200 && /Portal Room/i.test(b.text), `${b.status}`);
  const s = await front('/skill.md');
  check('front serves skill.md with the twin URLs', s.status === 200 && s.text.includes(`http://wiki.${TLD}:${FARM_PORT}`), `${s.status}`);
  const d = await front('/data.js'); const cfg = await front('/config.js'); const css = await front('/style.css');
  check('front serves data.js, config.js, style.css', d.status === 200 && cfg.status === 200 && css.status === 200, `${d.status}/${cfg.status}/${css.status}`);
}

// 6 · the front's data module, driven exactly as the browser drives it
const { createClient, kindOf } = await import(pathToFileURL(path.join(ROOT, 'site', 'data.js')).href);
const cfg = { wiki: `http://${WIKI}:${FARM_PORT}`, say: `http://${PORTAL}:${PORTAL_PORT}`, exchange: `http://${EXCHANGE}:${EXCHANGE_PORT}`, site: h => `http://${h}:${FARM_PORT}` };
const C = createClient(cfg, nodeFetch);
let roster = { residents: [], districts: [], all: [] };
{
  roster = await C.roster();
  check('data: roster → 3 residents + 4 districts', roster.residents.length === 3 && roster.districts.length === 4, `residents ${roster.residents.join(',')} · districts ${roster.districts.join(',')}`);
  const feed = await C.feed(roster.all, { limit: 60 });
  const hosts = new Set(feed.flatMap(t => t.sites.map(s => s.host)));
  const fl = feed.find(t => t.slug === 'first-light');
  check('data: live feed merges every site, first-light is a 2-site thread', hosts.size >= 5 && fl?.sites.length === 2, `${feed.length} threads · ${hosts.size} hosts · first-light ×${fl?.sites.length ?? 0}`);
  const kinds = new Set(feed.map(t => kindOf(t.sites[0].host, t.sites[0].slug)));
  check('data: the feed carries four kinds (post · standing · portal · district)', ['post', 'standing', 'portal', 'district'].every(k => kinds.has(k)) && kindOf(R('soulbae'), 'first-light') === 'post' && kindOf(R('soulbae'), 'role') === 'standing', [...kinds].join(','));
  const bae = await C.resident(R('soulbae'));
  const forks = await C.forksReceived(roster.all, R('soulbae'));
  const chip = C.chip(bae, forks);
  check('data: resident soulbae → mage persona, 30/30 carried, chip says unproven + vouched ×1', bae.persona === 'soulbae' && bae.alignment === 'mage' && bae.skills.carried === 30 && bae.skills.total === 30 && /unproven/.test(chip) && /vouched ×1/.test(chip), chip);
  check('data: the vouch is the fork soulbis→soulbae/first-light', forks.length === 1 && forks[0].from === R('soulbis') && forks[0].slug === 'first-light', JSON.stringify(forks));
  // the chip stops counting and starts verifying: soulbis publishes a signed record, soulbae
  // publishes none, and the front reads the difference off the page it was handed.
  const bis = await C.resident(R('soulbis'));
  const bisChip = C.chip(bis, await C.forksReceived(roster.all, R('soulbis')));
  check('data: soulbis publishes a signed VTA record and the front VERIFIES it (κ · did:key · walks)',
    bis.cityKey?.verified === true && bis.cityKey.live === true && bis.cityKey.walks === 3 && /^did:key:z6Mk/.test(bis.cityKey.did) && /κ [0-9a-f]{8} verified/.test(bisChip),
    bisChip);
  check('data: soulbae publishes no record and reads unproven — less shown, not a lower score',
    bae.cityKey?.present === false && bae.cityKey.verified === false && /unproven/.test(chip), bae.cityKey?.why);
  // one edited byte under the signature and the chip stops saying verified — read the real
  // slot off the real page, change it, and check the front refuses it by name.
  const { readCityKeySlot } = await import(pathToFileURL(path.join(ROOT, 'site', 'record.js')).href);
  const proofsPage = await C.page(R('soulbis'), 'proofs');
  const slot = JSON.parse((proofsPage.story || []).find(i => i.type === 'code').text).cityKey;
  const edited = await readCityKeySlot({ ...slot, vta: { ...slot.vta, walks: 99 } });
  const relabelled = await readCityKeySlot({ ...slot, kappa: 'sha256:' + '0'.repeat(64) });
  check('data: an edited walk count and a relabelled κ are both refused, each with its reason',
    edited.verified === false && /signature does not verify/.test(edited.why) && relabelled.verified === false && /κ the record did not sign/.test(relabelled.why),
    `${edited.why.slice(0, 34)}… | ${relabelled.why}`);
}

// 7 · the Portal: card, seeded topics, chain valid, page on the farm
{
  const card = await portal('/');
  check('portal desk answers with a chain head', card.status === 200 && /^[0-9a-f]{64}$/.test(card.json?.chain_head || ''), `${card.status} · ${card.json?.entries ?? '?'} entries`);
  const t = await portal('/topics');
  const names = (t.json?.topics || []).map(x => x.topic);
  check('portal seeded six threads incl. how-do-i-get-in', names.includes('how-do-i-get-in') && names.length >= 6, names.join(','));
  const L = await portal('/ledger');
  let prev = 'genesis', ok = true;
  for (const e of L.json?.ledger || []) { if (e.prev !== prev) { ok = false; break; } prev = sha(JSON.stringify(e)); }
  check('portal ledger chain verifies locally', ok && prev === L.json?.head, `${(L.json?.ledger || []).length} entries · head ${String(L.json?.head).slice(0, 12)}…`);
  const pg = await farm(PORTAL, '/how-do-i-get-in.json');
  check('portal thread is a page on the farm', pg.status === 200 && (pg.json?.story || []).some(i => /pinned answer/i.test(i.text || '')), `${pg.status}`);
}

// 8 · speak → page → chain → front data
const handle = 'verify-' + crypto.randomBytes(2).toString('hex');
let said = null;
{
  const text = `acceptance run ${new Date().toISOString()} — <b>tags stripped</b>, mail me at someone@example.org, secret=abc123`;
  const r = await portal('/say', 'POST', { handle, topic: 'first-contact', text });
  said = r.json;
  check('POST /say accepted + scrubbed', r.status === 200 && r.json?.ok && r.json?.scrubbed === true, `${r.status} · id ${r.json?.id}`);
  const pg = await farm(PORTAL, '/first-contact.json');
  const item = (pg.json?.story || []).find(i => (i.text || '').includes('#' + r.json?.id));
  check('message rendered on the thread page, scrubbed', !!item && /\[email\]/.test(item.text) && !/<b>/.test(item.text) && /secret=\[redacted\]/.test(item.text), item ? item.text.slice(0, 90).replace(/\n/g, ' ') : 'not found');
  const rr = await portal('/say', 'POST', { handle, topic: 'first-contact', text: 'a reply', reply_to: r.json?.id });
  check('reply_to an existing id accepted', rr.status === 200 && rr.json?.ok, `${rr.status}`);
  const bad = await portal('/say', 'POST', { handle, topic: 'no-such-topic', text: 'x' });
  check('unknown topic refused with the topic list', bad.status === 404 && Array.isArray(bad.json?.topics), `${bad.status}`);
  const recent = await C.portal.recent(5);
  check('data: /recent carries the message just said', recent.some(m => m.id === said?.id) && recent[0].topic, `${recent.length} recent · newest #${recent[0]?.id}`);
  const th = await C.portal.thread('first-contact');
  check('data: /thread/first-contact carries it too', th?.messages?.some(m => m.id === said?.id) && th.pinned === true, `${th?.messages?.length} messages · pinned ${th?.pinned}`);
}

// 9 · signed voice: good sig accepted, bad sig refused
{
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const raw = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('hex');
  const card = { participantId: 'ap-' + raw.slice(0, 16), publicKeyHex: raw };
  const msg = { handle, topic: 'first-contact', text: 'signed voice', reply_to: null };
  const sig = crypto.sign(null, Buffer.from(canon(msg)), privateKey).toString('hex');
  const good = await portal('/say', 'POST', { ...msg, card, sig });
  check('signed message accepted and marked signed', good.status === 200 && good.json?.signed === true, `${good.status}`);
  const badSig = await portal('/say', 'POST', { ...msg, text: 'tampered', card, sig });
  check('bad signature refused (never recorded)', badSig.status === 400, `${badSig.status} · ${badSig.json?.error?.slice(0, 50)}`);
}

// 10 · rate limit per handle · keeper doors
{
  let last = null;
  for (let i = 0; i < 14; i++) last = await portal('/say', 'POST', { handle, topic: 'questions-for-the-gate', text: 'rate ' + i });
  check('13th+ message in an hour from one handle → 429', last.status === 429, `${last.status}`);
  const r = await portal('/hide', 'POST', { id: 'x', reason: 'y' });
  check('hide without keeper token → 403', r.status === 403, `${r.status}`);
}

// 11 · fork evidence between the seed residents
{
  const pg = await farm(R('soulbis'), '/first-light.json');
  const fork = (pg.json?.journal || []).find(j => j.type === 'fork');
  check('soulbis/first-light carries a fork from soulbae', fork?.site === R('soulbae'), fork ? fork.site : 'no fork action');
}

// 11b · the Exchange desk — knowledge shared across the graph, receipts as counts
{
  const card = await exchange('/');
  check('exchange desk answers with a chain head', card.status === 200 && /^([0-9a-f]{64}|genesis)$/.test(card.json?.chain_head || ''), `${card.status} · ${card.json?.packets ?? '?'} packets · head ${String(card.json?.chain_head).slice(0, 12)}`);
  const stranger = await exchange('/offer', 'POST', { handle: 'nobody', packet: { name: 'x-doc', kind: 'doc', card: 'x', body: 'x', disclosure: 'D4' } });
  check('exchange: a non-resident may not offer', stranger.status === 403, `${stranger.status}`);
  const pn = 'verify-' + crypto.randomBytes(2).toString('hex');
  const d4 = await exchange('/offer', 'POST', { handle: 'soulbae', packet: { name: pn + '-open', kind: 'doc', title: 'An open note', card: 'a D4 packet from the acceptance run · fires when verify runs', body: 'The body is public at D4. mail: someone@example.org', disclosure: 'D4', terms: { attribution: 'required', no_train: true } } });
  const pg4 = await farm(EXCHANGE, `/${pn}-open.json`);
  check('exchange: a resident offers a D4 packet → rendered page with scrubbed body + hash', d4.status === 200 && d4.json?.ok && pg4.status === 200 && (pg4.json?.story || []).some(i => /\[email\]/.test(i.text || '')) && /^[0-9a-f]{64}$/.test(d4.json?.packet?.body_hash || ''), `${d4.status} · page ${pg4.status}`);
  const bodyHash = sha('a memory rendered down, held by soulbis');
  const d3bad = await exchange('/offer', 'POST', { handle: 'soulbis', packet: { name: pn + '-held', kind: 'memory', card: 'a D3 memory packet', body: 'should not be sent', body_hash: bodyHash, disclosure: 'D3' } });
  const d3 = await exchange('/offer', 'POST', { handle: 'soulbis', packet: { name: pn + '-held', kind: 'memory', card: 'a D3 memory packet · the body stays with the holder', body_hash: bodyHash, disclosure: 'D3', terms: { share_alike: true, expires: '2026-12-31' } } });
  const pg3 = await farm(EXCHANGE, `/${pn}-held.json`);
  check('exchange: a D3 memory packet refuses a body, carries the hash, page shows no body', d3bad.status === 400 && d3.status === 200 && pg3.status === 200 && !(pg3.json?.story || []).some(i => /should not be sent/.test(i.text || '')) && (pg3.json?.story || []).some(i => (i.text || '').includes(bodyHash)), `${d3bad.status}/${d3.status}`);
  const noGrant = await exchange('/adopt', 'POST', { handle: 'soulbae', packet: pn + '-held', from: 'soulbis' });
  const g = await exchange('/grant', 'POST', { handle: 'soulbis', to: 'soulbae', packet: pn + '-held', scope: 'body', cap: 3, expires: '2026-10-05' });
  const adopted = await exchange('/adopt', 'POST', { handle: 'soulbae', packet: pn + '-held', from: 'soulbis' });
  check('exchange: adopting a D3 packet needs a live grant; the holder grants scope · cap · expiry · terms digest', noGrant.status === 403 && g.status === 200 && g.json?.grant?.cap === 3 && /^[0-9a-f]{64}$/.test(g.json?.grant?.terms_digest || '') && adopted.status === 200, `${noGrant.status} → grant ${g.status} → adopt ${adopted.status}`);
  const selfR = await exchange('/attest', 'POST', { handle: 'soulbis', packet: pn + '-held', from: 'soulbis', run: 'x' });
  const noRun = await exchange('/attest', 'POST', { handle: 'soulbae', packet: pn + '-held', from: 'soulbis' });
  const att = await exchange('/attest', 'POST', { handle: 'soulbae', packet: pn + '-held', from: 'soulbis', run: 'verify.mjs acceptance run' });
  check('exchange: no self-receipts; attest needs a run ref', selfR.status === 400 && noRun.status === 400 && att.status === 200, `${selfR.status}/${noRun.status}/${att.status}`);
  const cat = await exchange('/catalog');
  const st = await exchange('/standing');
  const bis = (st.json?.standing || []).find(r => r.handle === 'soulbis');
  check('exchange: catalog in the Skill Sync packet shape; standing is counts', cat.json?.spec === 'skill-packet/0.1' && Array.isArray(cat.json?.packets) && cat.json.packets.some(p => p.name === pn + '-held' && p.hash === bodyHash) && bis?.adopted_by_others >= 1 && bis?.attested_by_others >= 1 && !('points' in (bis || {})), `${cat.json?.count} packets · soulbis adopted_by_others ${bis?.adopted_by_others}`);
  const L = await exchange('/ledger');
  let prev = 'genesis', ok = true;
  for (const e of L.json?.ledger || []) { if (e.prev !== prev) { ok = false; break; } prev = sha(JSON.stringify(e)); }
  check('exchange: ledger chain verifies', ok && prev === L.json?.head, `${(L.json?.ledger || []).length} entries`);
  const rec = await C.exchange.recent(5);
  check('data: exchange events reach the front as packet-lane items', rec.length >= 3 && rec[0].type === 'attest' && kindOf(EXCHANGE, 'offers') === 'packet', rec.map(e => e.type).join(','));
}

// 11c · the sharing agent feeds the Exchange; the three graphs; the spellweb + star exports
{
  const { feed, offerAll, THRESHOLDS } = await import(pathToFileURL(path.join(ROOT, 'bridges', 'community-security', 'feed.mjs')).href);
  const fx = JSON.parse(fs.readFileSync(path.join(ROOT, 'bridges', 'community-security', 'fixtures', 'findings.sample.json'), 'utf8'));
  const dry = feed(fx);
  const disc = Object.fromEntries(dry.offered.map(o => [o.packet.name, o.packet.disclosure]));
  check('bridge: thresholds PUBLIC→D4 · INTERNAL→D3 · CONFIDENTIAL→D2; pending findings skipped', THRESHOLDS.PUBLIC === 'D4' && disc['csa-101'] === 'D4' && disc['csa-102'] === 'D3' && disc['csa-103'] === 'D2' && dry.skipped.length === 1 && dry.skipped[0].id === 104, `${dry.offered.length} offered · ${dry.skipped.length} skipped (${dry.skipped[0]?.why?.slice(0, 30)}…)`);
  const d2 = dry.offered.find(o => o.packet.name === 'csa-103');
  check('bridge: a CONFIDENTIAL packet speaks in roles, carries a hash and no body; upload refs are digests', d2 && !d2.packet.body && /^[0-9a-f]{64}$/.test(d2.packet.body_hash) && /uploading organisation/.test(d2.packet.card) && /^upload:[0-9a-f]{12}$/.test(d2.packet.terms.source_ref) && d2.packet.terms.no_train === true, d2?.packet.card.slice(0, 80));
  const d3 = dry.offered.find(o => o.packet.name === 'csa-102');
  check('bridge: an INTERNAL card never quotes the held text', d3 && !/rotated validator keys/.test(d3.packet.card) && /grant to read/.test(d3.packet.card), d3?.packet.card.slice(0, 80));
  const posted = await offerAll(fx, { url: `http://${EXCHANGE}:${EXCHANGE_PORT}`, handle: 'systerrae' });
  const okAll = posted.results.every(r => r.ok || r.status === 409);
  const cat = await exchange('/catalog');
  const inCat = ['csa-101', 'csa-102', 'csa-103'].every(n => (cat.json?.packets || []).some(p => p.name === n && p.by === 'systerrae' && p.terms?.content_hash === p.hash));
  check('bridge: offered on the desk as systerrae; catalog carries content_hash = hash with provenance terms', okAll && inCat, posted.results.map(r => `${r.name}:${r.status}`).join(' '));
  const pg = await farm(EXCHANGE, '/csa-101.json');
  check('bridge: the PUBLIC finding is a rendered page with IoCs; the INTERNAL one shows only its hash', pg.status === 200 && (pg.json?.story || []).some(i => /proof replay/.test(i.text || '')) && !JSON.stringify((await farm(EXCHANGE, '/csa-102.json')).json?.story || []).includes('rotated validator keys'), `${pg.status}`);
  // corroboration: a distinct holder offers the same content hash
  const h102 = dry.offered.find(o => o.packet.name === 'csa-102').packet.body_hash;
  const cor = await exchange('/offer', 'POST', { handle: 'soulbis', packet: { name: 'csa-102-corroborated', kind: 'doc', card: 'the same finding, seen by a second holder', body_hash: h102, disclosure: 'D3' } });
  const g = await exchange('/graph');
  const edge = (g.json?.knowledge?.edges || []).find(e => e.type === 'corroborates' && e.hash === h102);
  check('graph: the same content hash from a distinct holder is a corroborates edge (Knowledge) and a Trust edge', (cor.status === 200 || cor.status === 409) && !!edge && (g.json?.trust?.edges || []).some(e => e.type === 'corroborates'), edge ? `${edge.from} ↔ ${edge.to}` : 'no edge');
  check('graph: Knowledge × Promise → Trust, computed at read time', g.json?.knowledge && g.json?.promise && g.json?.trust && (g.json.knowledge.edges || []).some(e => e.type === 'forged_by') && (g.json.knowledge.edges || []).some(e => e.type === 'anchors_to') && /read time/.test(g.json.note || ''), `${g.json?.knowledge?.nodes?.length} K nodes · ${g.json?.promise?.edges?.length} P edges · ${g.json?.trust?.edges?.length} T edges`);
  const { build } = await import(pathToFileURL(path.join(ROOT, 'bridges', 'graphs.mjs')).href);
  const outDir = path.join(ROOT, '.run', 'graphs-test');
  const built = await build({ out: outDir });
  const sw = JSON.parse(fs.readFileSync(path.join(outDir, 'spellweb.graph.json'), 'utf8'));
  const star = JSON.parse(fs.readFileSync(path.join(outDir, 'star.json'), 'utf8'));
  const swTypes = new Set(sw.edges.map(e => e.type));
  check('export: spellweb graph uses the union vocabulary (forged_by · anchors_to · relates_to · kin_to · witnessed_by) and parks grants in the extension', ['forged_by', 'anchors_to', 'relates_to', 'kin_to'].every(t => swTypes.has(t)) && sw.nodes.some(n => n.type === 'artefact' && /^sha256:[0-9a-f]{64}$/.test(n.proof)) && sw.edges_extension.some(e => e.type === 'grants'), `${sw.nodes.length} nodes · ${sw.edges.length} edges · ${sw.edges_extension.length} ext`);
  check('export: star chart in the Skill Sync shape (stars · edges · constellations · runtimes · runtimesProof)', ['built', 'cats', 'stars', 'edges', 'constellations', 'runtimes', 'runtimesProof'].every(k => k in star) && star.stars.some(s => s.kind === 'packet') && star.constellations[0].path.includes('csa-101') && star.runtimes.length >= 1, `${star.stars.length} stars · ${star.edges.length} edges · ${star.runtimes.length} runtimes`);
  fs.rmSync(outDir, { recursive: true, force: true });
}

// 11d · the City Key reader (gate/citykey.mjs) — re-derive, never trust
{
  const CK = await import(pathToFileURL(path.join(ROOT, 'gate', 'citykey.mjs')).href);
  const conf = CK.conformance();
  check('citykey: the packets Merkle conformance vector holds (byte parity with the site and the star pages)', conf.ok, conf.root.slice(0, 24) + '…');
  // a synthetic key: three packets → root, identity → did:key, κ stamped
  const { publicKey } = crypto.generateKeyPairSync('ed25519');
  const pub = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('hex');
  const mk = (shop, mode, vertex) => { const p = { v: 1, shopHref: shop, vertex, class: 'tool', witness: mode === 'sealed' ? 'ZK-witness' : 'Transparent-witness', ceremony: 'Bind · Prove · Reveal-nothing', payloadMode: mode, ceremonyTrace: [{ phase: 'Bind', evidence: CK.sha256('x'), kind: 'hash' }], bearer: { publicKeyHex: pub }, timestamp: '2026-09-05T00:00:00Z', anchoredTo: CK.sha256('class'), districtRoot: CK.sha256('district') }; if (mode === 'sealed') p.commitment = CK.sha256('secret'); else p.body = 'public body'; p.proof = CK.packetProofOf(p); return p; };
  const packets = [mk('/circuit', 'sealed', 38), mk('/jeweler', 'revealed', 25), mk('/tailor', 'refractive', 28)];
  const key = { name: 'verify key', version: 1, palette: { cool: '#141a3d', warm: '#f0eee8', sword: '#e8523a', mage: '#4dd9e8' }, descriptions: {}, lit: [38, 25, 28], identity: { publicKeyHex: pub, trustTier: 'light' }, packets: { root: CK.packetsRoot(packets.map(p => p.proof)), count: 3 }, did: CK.didKeyOf(pub), prior: CK.sha256('the key before'), walks: [{ name: 'a walk', steps: [{ site: null, slug: 'welcome-visitors', vertex: 38, element: CK.walkElement(38, 'welcome-visitors', ['b', 'a']) }], digest: CK.sha256('steps') }] };
  key.kappa = CK.kappaOf(key);
  const v = CK.verifyKey(key, packets);
  check('citykey: a stamped key re-derives — κ · 3 packet proofs · packets.root · did:key(z6Mk…) · prior · walk elements', v.ok && v.kappa.ok === true && v.packets.verified === 3 && v.packets.rootOk === true && v.identity.didOk === true && /^did:key:z6Mk/.test(key.did) && v.walks[0].elementsOk && v.findings.length === 0, `κ ${v.kappa.expected.slice(0, 20)}… · did ${key.did.slice(0, 16)}…`);
  const tampered = { ...key, lit: [1] };
  const t = CK.verifyKey(tampered, packets);
  const badPacket = { ...packets[1], body: 'edited body' };
  const bp = CK.verifyPacket(badPacket);
  check('citykey: a tampered key and an edited packet are refused with the finding named', t.ok === false && t.kappa.ok === false && /κ mismatch/.test(t.findings[0]) && bp.ok === false, t.findings[0].slice(0, 40) + '…');
  const ev = CK.evidenceOf(key, packets, { member: true, vouches: 2, met: 1 });
  const { rungOf: rung } = await import(pathToFileURL(path.join(ROOT, 'gate', 'names.mjs')).href);
  check('citykey: evidence → the Namekeeper\'s rung (vouched) and the chip (light · 3 packets · 1 walks)', rung(ev) === 2 && ev.proven && ev.sealed === 1 && ev.revealed === 1 && ev.refractive === 1 && CK.chipOf(ev, ev.vouches) === 'light · 3 packets · 1 walks · vouched ×2', CK.chipOf(ev, ev.vouches));
  const bare = CK.verifyKey({ name: 'bare', version: 1, palette: key.palette, descriptions: {} });
  check('citykey: an unexported working key is valid and unproven, not refused', bare.ok && bare.kappa.ok === null && CK.chipOf(CK.evidenceOf({ name: 'bare', version: 1, palette: key.palette, descriptions: {} })).startsWith('blade · unproven'), bare.findings[0]);
}

// 11e · the record beside the key (site/record.js) — the City verifies what the Swordsman signed.
// The signer lives in the other lane (~/agentprivacy-mcp/lib/sign.mjs). These rows are the seam:
// if either side ever changes its canonical form, its did:key derivation or the bytes it signs
// over, the City would start refusing real records — so the drift is caught HERE, not in public.
{
  const RC = await import(pathToFileURL(path.join(ROOT, 'site', 'record.js')).href);
  const CK = await import(pathToFileURL(path.join(ROOT, 'gate', 'citykey.mjs')).href);
  const key = { name: 'seam key', version: 1, kind: 'city-key', identity: { swordsman: 'ap-0123456789abcdef' }, lattice: { 31: 60 }, weight: 60, prior: CK.sha256('before') };
  check('record: the browser verifier and the gate reader derive the same κ from the same key (byte parity)',
    (await RC.kappaOf(key)) === CK.kappaOf(key) && RC.canonical(key, ['kappa']) === CK.canonical(key, ['kappa']),
    (await RC.kappaOf(key)).slice(0, 26) + '…');

  // sign with node:crypto exactly as the Swordsman does, verify with WebCrypto in the front
  const seed = crypto.randomBytes(32).toString('hex');
  const priv = crypto.createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.from(seed, 'hex')]), format: 'der', type: 'pkcs8' });
  const pub = crypto.createPublicKey(priv).export({ type: 'spki', format: 'der' }).subarray(-32).toString('hex');
  const kappa = await RC.kappaOf(key);
  const rec = { kind: RC.VTA_KIND, publicKeyHex: pub, participantId: RC.participantIdOf(pub), did: RC.didKeyOf(pub), kappa, prior: key.prior, at: new Date().toISOString(), walks: 4, vrcs: [] };
  rec.sig = crypto.sign(null, Buffer.from(RC.recordMessage(rec), 'utf8'), priv).toString('hex');
  const v = await RC.verifyRecord(rec, key);
  check('record: an ed25519 record signed the Swordsman\'s way verifies in the front, and names THIS key (L5)',
    v.ok === true && v.keyMatches === true && /^did:key:z6Mk/.test(v.did) && v.participantId === 'ap-' + pub.slice(0, 16),
    `${v.did.slice(0, 24)}… · walks ${v.walks}`);
  check('record: did:key derives the same on both sides of the seam',
    RC.didKeyOf(pub) === CK.didKeyOf(pub), CK.didKeyOf(pub).slice(0, 28) + '…');

  const wrongKey = { ...key, weight: 61 };
  const paired = await RC.verifyRecord(rec, wrongKey);
  const forged = await RC.verifyRecord({ ...rec, kappa: 'sha256:' + 'a'.repeat(64) });
  check('record: a record paired with the wrong key, and a re-labelled κ, are refused with the reason named',
    paired.ok === false && /re-derives to/.test(paired.why) && forged.ok === false && /signature does not verify/.test(forged.why),
    paired.why.slice(0, 52) + '…');

  const fresh = await RC.evolvedSince(rec, new Date(Date.now() - 864e5).toISOString(), { horizonDays: 90 });
  const stale = await RC.readCityKeySlot({ kappa, prior: key.prior, did: rec.did, publicKeyHex: pub, signedAt: rec.at, vta: rec }, { horizonDays: 90, now: new Date(Date.now() + 200 * 864e5) });
  check('record: evolved_since holds for a fresh evolution; past the horizon the same record reads stale, not invalid',
    fresh.ok === true && stale.verified === true && stale.live === false,
    `signed ${fresh.signedAt.slice(0, 10)} · expires ${String(stale.expires).slice(0, 10)}`);

  const noCard = await RC.verifyCard({ publicKeyHex: pub, participantId: 'ap-' + pub.slice(0, 16), signature: 'ab'.repeat(64), displayName: 'x', grimoires: [], privacy: {}, trustTier: 'blade' });
  check('record: an AgentCard whose ceremony signature does not check is refused — the City never re-issues identity',
    noCard.ok === false && /signature does not verify/.test(noCard.why), noCard.why);
}

// 12 · the Namekeeper (gate/names.mjs) — DNS write access earned on the trust graph, dry-run
{
  const { createNamekeeper, rungOf, RUNGS } = await import(pathToFileURL(path.join(ROOT, 'gate', 'names.mjs')).href);
  const data = path.join(ROOT, '.run', 'names-test-' + crypto.randomBytes(3).toString('hex'));
  const nk = createNamekeeper({ data, tld: TLD, apply: false });
  check('names: the ladder — 0 spoken · 1 admitted · 2 vouched · 3 witnessed', rungOf({}) === 0 && rungOf({ member: true }) === 1 && rungOf({ member: true, vouches: 2, met: 1 }) === 2 && rungOf({ member: true, vouches: 2, met: 1, vwc: 1 }) === 3 && rungOf({ member: true, vouches: 5, met: 0, vwc: 3 }) === 1, RUNGS.map(r => r.name).join(' → '));
  const ap = 'ap-' + crypto.randomBytes(8).toString('hex');
  const r0 = nk.claim('verify-agent', ap, { evidence: {} });
  const rW = nk.claim('wiki', ap, { evidence: { member: true } });
  const rC = nk.claim('soulbae', ap, { evidence: { member: true } });
  check('names: rung 0, a fixed host and a cast name are all refused', !r0.ok && !rW.ok && !rC.ok, `${r0.why?.slice(0, 20)}… · ${rW.why} · ${rC.why}`);
  const r1 = nk.claim('verify-agent', ap, { evidence: { member: true } });
  const dup = nk.claim('verify-agent', ap, { evidence: { member: true } });
  check('names: admitted → claimed at rung 1 with a TXT claim marker; second claim refused', r1.ok && r1.rung === 1 && r1.records.some(x => /_mages\.verify-agent/.test(x)) && !dup.ok, `rung ${r1.rung} · ${r1.apply?.commands?.length} dry-run commands · dup: ${dup.why}`);
  const wTxt = nk.write('verify-agent', { type: 'TXT', value: 'did:webvh:proof' });
  const wA = nk.write('verify-agent', { type: 'A', value: '203.0.113.7' });
  check('names: rung 1 may write TXT through the broker, not A', wTxt.ok && !wA.ok && /rung 2/.test(wA.why), wA.why?.slice(0, 70));
  const e2 = nk.elevate('verify-agent', { member: true, vouches: 2, met: 1 });
  const wA2 = nk.write('verify-agent', { type: 'A', value: '203.0.113.7' });
  check('names: vouched → rung 2, A allowed, still no key of its own', e2.ok && e2.rung === 2 && !e2.tsig && wA2.ok && !nk.list()[0].key, `rung ${e2.rung} · key ${nk.list()[0].key}`);
  const e3 = nk.elevate('verify-agent', { member: true, vouches: 2, met: 1, vwc: 1 });
  const conf = fs.readFileSync(path.join(data, 'keys', 'agents.conf'), 'utf8');
  check('names: witnessed → rung 3, its own TSIG key rendered into agents.conf (selfsub)', e3.ok && e3.rung === 3 && e3.tsig?.name === `verify-agent.${TLD}.` && conf.includes(`key "verify-agent.${TLD}."`) && !JSON.stringify(nk.entries()).includes(e3.tsig.secret), `key ${e3.tsig?.name} · secret absent from ledger`);
  check('names: ask — apex, fixed hosts, claimed names allowed; unknown and two-level refused', nk.isAllowed(TLD) && nk.isAllowed('wiki.' + TLD) && nk.isAllowed('verify-agent.' + TLD) && !nk.isAllowed('nobody.' + TLD) && !nk.isAllowed('a.b.' + TLD), '');
  const rel = nk.release('verify-agent', 'acceptance run');
  const conf2 = fs.readFileSync(path.join(data, 'keys', 'agents.conf'), 'utf8');
  check('names: release withdraws the key, keeps the history, chain verifies', rel.ok && !conf2.includes('verify-agent') && !nk.isAllowed('verify-agent.' + TLD) && nk.verifyChain() && nk.entries().filter(e => e.name === 'verify-agent').length === 6, `${nk.entries().length} ledger entries`);
  fs.rmSync(data, { recursive: true, force: true });
}

// report
let fails = 0;
for (const r of rows) { if (!r.ok) fails++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`); }
console.log(`\n${rows.length - fails}/${rows.length} PASS${fails ? ' · ' + fails + ' FAIL' : ''}`);
process.exit(fails ? 1 : 0);
