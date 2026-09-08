import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openCheckpointStore} from './checkpoint-store.mjs';
import {runSetup,intentDigest} from './setup.mjs';
function storage(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'city-mage-checkpoint-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  return path.join(dir,'checkpoint.json');
}
const state = revision=>({kind:'agentprivacy.city-mage-checkpoint/1',binding:'fixture',revision,receipts:{},pending:null});
test('independent stores reject stale writers and preserve committed bytes',async t=>{
  const file=storage(t), a=openCheckpointStore(file), b=openCheckpointStore(file);
  assert.equal(a.load(),null);
  const results=await Promise.allSettled([a.persist(state(1),{expectedRevision:0}),b.persist(state(1),{expectedRevision:0})]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
  assert.deepEqual(b.load(),state(1));
  await assert.rejects(b.persist({...state(2),binding:'other'},{expectedRevision:1}),/context conflict/);
  assert.deepEqual(a.load(),state(1));
});
test('retained locks and corrupt records fail closed without discarding evidence',async t=>{
  const file=storage(t), store=openCheckpointStore(file);
  fs.writeFileSync(file+'.lock','retained operation');
  await assert.rejects(store.persist(state(1),{expectedRevision:0}),{code:'EEXIST'});
  assert.equal(fs.readFileSync(file+'.lock','utf8'),'retained operation');
  fs.unlinkSync(file+'.lock'); fs.writeFileSync(file,'{broken');
  assert.throws(()=>store.load());
  await assert.rejects(store.persist(state(1),{expectedRevision:0}));
  assert.equal(fs.readFileSync(file,'utf8'),'{broken');
  assert.equal(fs.existsSync(file+'.lock'),false);
});
test('setup survives reopening storage and reconciles the original uncertain operation',async t=>{
  const file=storage(t), first=openCheckpointStore(file);
  const context={subject:'fixture',audience:'https://example.invalid',keyKappa:'sha256:'+'a'.repeat(64)};
  const verifyReceipt=async r=>({valid:r.fixture===true}); // Scheduling only.
  const receipt=i=>({id:i.operationId,intentDigest:intentDigest(i),status:'applied',validUntil:'2030-01-01T00:00:00Z',fixture:true});
  const now=()=>Date.parse('2026-09-07');
  let calls=0, original;
  const failed=await runSetup({context,persist:first.persist,verifyReceipt,now,adapters:{discover:{execute:async i=>{calls++;original=i;throw Error('lost reply');}}}});
  assert.equal(failed.status,'unconfirmed');
  const reopened=openCheckpointStore(file);
  const resumed=await runSetup({context,checkpoint:reopened.load(),persist:reopened.persist,verifyReceipt,now,adapters:{discover:{execute:async()=>{throw Error('must not repeat');},reconcile:async i=>{assert.deepEqual(i,original);return receipt(i);}}}});
  assert.equal(calls,1); assert.equal(resumed.stage,'carry-key');
  assert.equal(resumed.status,'needs-adapter'); assert.equal(resumed.authenticatedWebsite,false);
  assert.equal(reopened.load().pending,null);
});
