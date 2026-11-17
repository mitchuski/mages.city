// join-fallback: Mages City's front door stays open while the City's node rests.
//
// Routes: join.mages.city/*, vtc.mages.city/v1/trust-tasks*, vtc.mages.city/v1/community/*.
// Node up: every request passes straight through to the origin (the mages-core tunnel), untouched.
// Node down (the tunnel answers 502-504/520-530, or does not answer within ORIGIN_MS):
//   join.mages.city      the saved copy of the join site, with a notice and a way to leave your DID
//   vtc  /v1/community/*  the saved public profile and DID QR, so the join page still shows the City
//   vtc  /v1/trust-tasks  an honest trust-task error, code "unavailable" (unsigned: wallets read errors
//                         before checking signatures; nothing here can or does speak as the City)
// POST join.mages.city/api/held  holds a DID left while the node rested. The browser seals it to the
//   City's holding key (RSA-OAEP + AES-GCM) before sending; the Worker stores only ciphertext, in KV.
//   The private key lives off the edge (keeper_mage/keys/city-join.private.jwk); tools/read_held.mjs opens them.

const ORIGIN_MS = 12000; // wallets give up after 20 s
const DOWN = s => s === 502 || s === 503 || s === 504 || (s >= 520 && s <= 530);
const JOIN = 'https://join.mages.city';
const json = (o, status = 200, h = {}) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...h } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url), host = url.hostname, isJoin = host.startsWith('join.');
    if (isJoin && url.pathname === '/api/held') return req.method === 'POST' ? hold(req, env) : json({ error: 'POST only' }, 405);
    if (isJoin && (url.pathname.startsWith('/resting') || url.pathname === '/city-join.pub.jwk')) return asset(env, '/join' + url.pathname, url);

    const copy = req.method === 'POST' ? req.clone() : null;
    let res = null;
    try { res = await fetch(env.TEST_ORIGIN ? retarget(req, env.TEST_ORIGIN) : req, { signal: AbortSignal.timeout(ORIGIN_MS) }); } catch (e) { res = null; }
    if (res && !DOWN(res.status)) return res;

    if (isJoin) return restingJoin(env, url, req);
    if (url.pathname.startsWith('/v1/trust-tasks')) return unavailable(copy);
    if (url.pathname === '/v1/community/public-profile') return cors(await asset(env, '/vtc/public-profile.json', url), req);
    if (url.pathname === '/v1/community/did-qr.svg') return cors(await asset(env, '/vtc/did-qr.svg', url), req);
    return json({ error: 'The City\'s node is resting. Try again later.' }, 503, { 'retry-after': '1800' });
  }
};

function retarget(req, origin) { const u = new URL(req.url), o = new URL(origin); u.protocol = o.protocol; u.host = o.host; return new Request(u, req); }
async function asset(env, path, url) {
  const res = await env.ASSETS.fetch(new Request(new URL(path, url.origin)));
  if (!path.endsWith('.jwk') || !res.ok) return res;
  const r = new Response(res.body, res); r.headers.set('content-type', 'application/jwk+json'); return r;
}
function cors(res, req) {
  const r = new Response(res.body, res), o = req.headers.get('origin');
  if (o === JOIN) r.headers.set('access-control-allow-origin', JOIN);
  r.headers.set('cache-control', 'no-store'); return r;
}

async function unavailable(copy) {
  let threadId; try { threadId = (await copy.json()).id; } catch (e) {}
  return json({
    type: 'https://trusttasks.org/spec/trust-task-error/0.1', ...(threadId ? { threadId } : {}),
    payload: { code: 'unavailable', retryable: false, message: 'Mages City\'s node is resting, so it cannot take a join request right now. Leave your DID at ' + JOIN + '/resting/ and the City will invite you when it is back.' }
  }, 503, { 'retry-after': '1800' });
}

const NOTICE = '<div style="position:sticky;top:0;z-index:99;background:#1F4BFF;color:#fff;font:600 15px/1.45 system-ui,sans-serif;padding:12px 16px;text-align:center">'
  + 'The City\'s node is resting right now, so joining has to wait. <a href="/resting/" style="color:#fff;text-decoration:underline">Leave your DID</a> and you will be invited when it is back.</div>';
async function restingJoin(env, url, req) {
  let p = url.pathname; if (p.endsWith('/')) p += 'index.html';
  let res = await asset(env, '/join' + p, url);
  if (res.status === 404 && !/\.[a-z0-9]+$/i.test(p)) res = await asset(env, '/join' + p + '/index.html', url);
  if (res.status === 404) return Response.redirect(JOIN + '/resting/', 302);
  const r = new Response(res.body, res); r.headers.set('cache-control', 'no-store'); r.headers.set('x-city-node', 'resting');
  if ((r.headers.get('content-type') || '').includes('text/html')) return new HTMLRewriter().on('body', { element(e) { e.prepend(NOTICE, { html: true }); } }).transform(r);
  return r;
}

async function hold(req, env) {
  if (+(req.headers.get('content-length') || 0) > 16384) return json({ error: 'Too large.' }, 413);
  let b; try { b = await req.json(); } catch (e) { return json({ error: 'Not JSON.' }, 400); }
  const ok = s => typeof s === 'string' && /^[A-Za-z0-9+/=]+$/.test(s);
  if (!ok(b.iv) || !ok(b.ct) || !ok(b.wrapped) || b.ct.length > 12000 || b.wrapped.length > 600 || b.iv.length > 24) return json({ error: 'That was not a sealed note.' }, 400);
  const ip = req.headers.get('cf-connecting-ip') || 'x', hour = new Date().toISOString().slice(0, 13), rl = 'rl:' + ip + ':' + hour;
  const n = +(await env.HELD.get(rl) || 0); if (n >= 5) return json({ error: 'Too many from here this hour. Try again later.' }, 429);
  await env.HELD.put(rl, String(n + 1), { expirationTtl: 3700 });
  const at = new Date().toISOString(), id = at + ':' + crypto.randomUUID().slice(0, 8);
  await env.HELD.put('held:' + id, JSON.stringify({ iv: b.iv, ct: b.ct, wrapped: b.wrapped, at }), { expirationTtl: 60 * 60 * 24 * 120 });
  return json({ ok: true, at });
}
