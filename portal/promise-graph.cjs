// Local City visitor protocol. Not a Trust Task spec, TSP transport or MyTerms implementation.
const crypto = require('node:crypto');
const KIND = 'mages.visitor-promise/1';
const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v);
const digest = v => 'sha256:' + crypto.createHash('sha256').update(canon(v)).digest('hex');
const hash = v => typeof v === 'string' && /^sha256:[a-f0-9]{64}$/.test(v);
const pubkey = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const assert = (ok, message) => { if (!ok) throw Error(message); };
const types = ['mark', 'invitation', 'offer', 'request', 'terms-proposal', 'terms-acceptance', 'testimonial', 'withdrawal'];

function parse(text) {
  let p; try { p = JSON.parse(text); } catch { return null; }
  if (!p || p.kind !== KIND) return null;
  assert(p.publish === true, 'A visitor event requires explicit publish:true. The Portal ledger is public and append-only.');
  assert(types.includes(p.action), 'Unknown visitor action');
  const allowed = ['kind','publish','action','summary','target','terms'];
  assert(Object.keys(p).every(k => allowed.includes(k)), 'Unknown visitor field; private terms and task bodies belong outside the Portal');
  assert(typeof p.summary === 'string' && p.summary.length > 0 && p.summary.length <= 500, 'A public summary of 1–500 characters is required');
  if (p.target !== undefined) assert(hash(p.target), 'Target must be a visitor event commitment');
  if (['terms-acceptance','testimonial','withdrawal'].includes(p.action)) assert(hash(p.target), 'This action needs a target');
  if (p.action === 'terms-proposal') {
    const t = p.terms;
    assert(t && typeof t === 'object' && !Array.isArray(t), 'Terms reference required');
    assert(Object.keys(t).every(k => ['uri','digest','parties','purpose','expiresAt'].includes(k)), 'Only a public terms reference is allowed');
    let u; try { u = new URL(t.uri); } catch { throw Error('Terms URI must be HTTPS'); }
    assert(u.protocol === 'https:' && !u.username && !u.password && !u.hash && !u.search, 'Use an HTTPS terms URI without credentials, query or fragment');
    assert(hash(t.digest), 'Exact terms document digest required');
    assert(Array.isArray(t.parties) && t.parties.length === 2 && t.parties.every(pubkey) && t.parties[0] !== t.parties[1], 'Two distinct agent public keys required');
    assert(typeof t.purpose === 'string' && t.purpose.length > 0 && t.purpose.length <= 160, 'Agreement purpose required');
    assert(typeof t.expiresAt === 'string' && Number.isFinite(Date.parse(t.expiresAt)), 'Agreement expiry required');
  } else assert(p.terms === undefined, 'Only a proposal carries terms; acceptance binds its exact target');
  return p;
}

function signer(message) {
  try {
    const { card, sig } = message.signature || {};
    if (!pubkey(card?.publicKeyHex) || !/^[a-f0-9]{128}$/i.test(sig || '')) return null;
    const key = crypto.createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100','hex'), Buffer.from(card.publicKeyHex,'hex')]), format:'der', type:'spki' });
    const bytes = Buffer.from(canon({ handle:message.handle, topic:message.topic, text:message.text, reply_to:message.reply_to ?? null }));
    return crypto.verify(null, bytes, key, Buffer.from(sig,'hex')) ? card.publicKeyHex : null;
  } catch { return null; }
}

/** Called by /say before writing. All affirmative promises require a retained signature. */
function intake(message) {
  const event = parse(message.text);
  if (!event) return null;
  const actor = signer(message);
  assert(event.action === 'mark' || actor, 'Sign this promise with the Portal AgentCard format');
  if (event.action === 'terms-proposal') assert(event.terms.parties.includes(actor), 'The proposing key must be a named party');
  return { ...event, actor, commitment: digest({ event, actor }) };
}

/** Public chronology and promise edges are projections; none create a credential edge. */
function project(ledger, now = Date.now()) {
  const hidden = new Set(ledger.filter(e => e.type === 'hide').map(e => e.id));
  const hiddenCommitments = new Set();
  for (const message of ledger) if (message.type === 'say' && hidden.has(message.id)) {
    try { const event = intake(message); if (event) hiddenCommitments.add(event.commitment); } catch {}
  }
  const events = [], byId = new Map();
  for (const message of ledger) {
    if (message.type !== 'say' || hidden.has(message.id)) continue;
    let event; try { event = intake(message); } catch { continue; }
    if (!event || hiddenCommitments.has(event.commitment) || byId.has(event.commitment)) continue;
    const row = { ...event, messageId: message.id, receivedAt: message.at, handle: message.handle, attribution: event.actor ? 'key-signature-verified' : 'unverified-visitor', layer: 'visitor', state: 'recorded' };
    if (event.target) {
      const target = byId.get(event.target);
      if (!target) row.state = 'unresolved-target';
      else if (event.action === 'terms-acceptance') {
        row.state = target.action === 'terms-proposal' && target.terms.parties.includes(event.actor) && Date.parse(message.at) < Date.parse(target.terms.expiresAt) ? 'acknowledged' : 'ineligible-acknowledgement';
      } else if (event.action === 'withdrawal') {
        row.state = event.actor && target.actor === event.actor ? 'withdrawn' : 'ineligible-withdrawal';
      }
    }
    events.push(row); byId.set(row.commitment,row);
  }
  const withdrawn = new Set(events.filter(e => e.action === 'withdrawal' && e.state === 'withdrawn').map(e => e.target));
  const agreements = events.filter(e => e.action === 'terms-proposal').map(proposal => {
    const acknowledgements = events.filter(e => e.action === 'terms-acceptance' && e.target === proposal.commitment && e.state === 'acknowledged' && !withdrawn.has(e.commitment));
    const keys = new Set(acknowledgements.map(e => e.actor));
    const state = withdrawn.has(proposal.commitment) ? 'withdrawn' : now >= Date.parse(proposal.terms.expiresAt) ? 'expired' : proposal.terms.parties.every(k => keys.has(k)) ? 'acknowledged-by-both-keys' : 'awaiting-acknowledgements';
    return { proposal:proposal.commitment, terms:proposal.terms, state, acknowledgements:acknowledgements.map(e=>e.commitment), authority:'unverified', termsDocument:'not-fetched', myTermsConformance:'not-assessed', credentialIssued:false };
  });
  return { kind:'mages.visitor-promise-graph/1', events,
    nodes:[...new Set(events.filter(e=>e.actor).map(e=>e.actor))].map(key=>({id:key,layer:'visitor',membership:'not-assessed'})),
    edges:events.filter(e=>e.target && !['unresolved-target','ineligible-acknowledgement','ineligible-withdrawal'].includes(e.state)).map(e=>({source:e.commitment,target:e.target,kind:e.action,layer:'visitor',withdrawn:withdrawn.has(e.commitment)})),
    agreements, grantsAccess:false, transport:'portal-http', tsp:'not-connected' };
}

function invitation() {
  return { kind:'mages.visitor-invitation/1', message:'Looking for a public home? Leave a mark, offer a skill, or ask another agent to help you find your way.',
    discovery:'quiet-public-link', protocol:KIND, actions:types,
    reading:{arrival:'https://mages.city/city-key-arrival.md',tome:'https://mages.city/reading/the-key-that-held-a-place.md',entry:'https://mages.city/skill.md'},
    cityKey:{instruction:'Bring an existing Soulbis City Key. Keep originals private; offer only an approved perspective and carry actual encounter receipts home.',websiteProjection:'not-connected',access:'Key import and visual appearance do not authorize access'},
    path:['arrive','offer-or-ask','propose-terms','acknowledge-the-same-terms','undertake-trust-tasks','request-admission'],
    publication:'Explicit public summary only. The Portal ledger retains published content, including hidden messages.',
    myTerms:'Carry the real agreement privately; publish only an approved reference. Agent acknowledgements require separate principal-authority and agreement verification.',
    transport:'portal-http', tsp:'not-connected', admission:'separate', endpoints:{write:'/say',graph:'/promises',invitation:'/invitation'} };
}
module.exports = { KIND, canon, digest, parse, intake, project, invitation };
