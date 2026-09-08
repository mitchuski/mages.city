import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import P from '../portal/promise-graph.cjs';

const key = () => { const k=crypto.generateKeyPairSync('ed25519');return {...k,hex:k.publicKey.export({type:'spki',format:'der'}).subarray(-32).toString('hex')}; };
const a=key(), b=key(), stranger=key();
const H='sha256:'+'a'.repeat(64);
let serial=0;
const event=(action,extra={})=>({kind:P.KIND,publish:true,action,summary:'A public encounter',...extra});
function message(event,k=a) {
  const m={type:'say',id:String(++serial),handle:'visitor',topic:'first-contact',text:JSON.stringify(event),reply_to:null,at:'2026-09-07T12:00:00Z'};
  if(k)m.signature={card:{publicKeyHex:k.hex},sig:crypto.sign(null,Buffer.from(P.canon({handle:m.handle,topic:m.topic,text:m.text,reply_to:null})),k.privateKey).toString('hex')};
  return m;
}
const proposal=()=>message(event('terms-proposal',{terms:{uri:'https://example.org/terms/v1',digest:H,parties:[a.hex,b.hex],purpose:'Help establish a VTA; no publication of private conversation',expiresAt:'2026-10-01T00:00:00Z'}}));
const now=Date.parse('2026-09-08T00:00:00Z');

test('unadmitted visitors can leave marks; promises need exact signatures and publication consent',()=>{
  const m=message(event('mark'),null);
  assert.equal(P.project([m],now).events[0].attribution,'unverified-visitor');
  assert.equal(P.project([m],now).nodes.length,0);
  assert.throws(()=>P.intake(message(event('offer'),null)),/Sign this promise/);
  assert.throws(()=>P.intake(message(event('mark',{publish:false}))),/publish:true/);
  const signed=message(event('offer'));signed.text=signed.text.replace('encounter','substitution');
  assert.throws(()=>P.intake(signed),/Sign this promise/);
});

test('the first agreement requires both named keys acknowledging exactly the same proposal',()=>{
  const p=proposal(), target=P.intake(p).commitment;
  const one=message(event('terms-acceptance',{target}),a), two=message(event('terms-acceptance',{target}),b);
  assert.equal(P.project([p,one],now).agreements[0].state,'awaiting-acknowledgements');
  const graph=P.project([p,one,two,two],now);
  assert.equal(graph.agreements[0].state,'acknowledged-by-both-keys');
  assert.equal(graph.events.length,3);
  assert.equal(graph.agreements[0].authority,'unverified');
  assert.equal(graph.agreements[0].credentialIssued,false);
  assert.equal(graph.grantsAccess,false);
  assert.equal(P.project([p,one,message(event('terms-acceptance',{target}),stranger)],now).agreements[0].state,'awaiting-acknowledgements');
  assert.equal(P.project([p,one,message(event('terms-acceptance',{target:H}),b)],now).agreements[0].state,'awaiting-acknowledgements');
});

test('withdrawals are author-bound, hiding suppresses the graph, expiry ends the current acknowledgement state',()=>{
  const p=proposal(), target=P.intake(p).commitment;
  const a1=message(event('terms-acceptance',{target}),a), b1=message(event('terms-acceptance',{target}),b);
  const baseline=[p,a1,b1];
  const withdrawal=message(event('withdrawal',{target:P.intake(a1).commitment}),a);
  assert.equal(P.project([...baseline,withdrawal],now).agreements[0].state,'awaiting-acknowledgements');
  const spoof=message(event('withdrawal',{target:P.intake(a1).commitment}),stranger);
  assert.equal(P.project([...baseline,spoof],now).agreements[0].state,'acknowledged-by-both-keys');
  assert.equal(P.project([...baseline,{type:'hide',id:b1.id}],now).agreements[0].state,'awaiting-acknowledgements');
  assert.equal(P.project([...baseline,{type:'hide',id:b1.id},{...b1,id:'replay'}],now).agreements[0].state,'awaiting-acknowledgements');
  assert.equal(P.project(baseline,Date.parse('2027-01-01')).agreements[0].state,'expired');
});

test('a testimonial links a report to its encounter without minting a trust edge',()=>{
  const offer=message(event('offer')), testimonial=message(event('testimonial',{target:P.intake(offer).commitment,summary:'I followed this setup guide and got as far as a local VTA.'}),b);
  const graph=P.project([offer,testimonial],now);
  assert.equal(graph.edges[0].kind,'testimonial');
  assert.equal(graph.edges[0].layer,'visitor');
  assert.equal(graph.agreements.length,0);
  assert.throws(()=>P.intake(message(event('terms-proposal',{terms:{uri:'https://example.org/?token=private'}}))),/without credentials/);
});
