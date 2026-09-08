import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runSetup,intentDigest} from './setup.mjs';
const stages=JSON.parse(fs.readFileSync(new URL('./runtime.json',import.meta.url))).stages;
const context={subject:'fixture-agent',audience:'https://example.invalid',keyKappa:'sha256:'+'a'.repeat(64)};
const receipt=intent=>({id:intent.operationId,intentDigest:intentDigest(intent),status:'applied',validUntil:'2030-01-01T00:00:00Z',fixture:true});
const verifyReceipt=async r=>({valid:r.fixture===true}); // Scheduler fixtures, not credential verification.
const now=()=>Date.parse('2026-09-07');
function fixture(){let saved=null,executions=0;const adapters=Object.fromEntries(stages.map(s=>[s.id,{authorize:async()=>true,execute:async i=>{executions++;return receipt(i);}}]));return {adapters,persist:async(s,{expectedRevision})=>{if((saved?.revision??0)!==expectedRevision)throw Error('checkpoint conflict');saved=s;return {revision:s.revision};},get saved(){return saved;},get executions(){return executions;}};}
test('fixture receipts resume without repeating effects; status never claims website authentication',async()=>{
 const f=fixture();const first=await runSetup({context,...f,verifyReceipt,now});assert.equal(first.status,'receipts-complete');assert.equal(first.authenticatedWebsite,false);const n=f.executions;
 const second=await runSetup({context,adapters:f.adapters,persist:f.persist,verifyReceipt,now,checkpoint:f.saved});assert.equal(second.status,'receipts-complete');assert.equal(f.executions,n);
});
test('missing live adapters and exact-stage authorization stop progress',async()=>{
 const f=fixture();assert.equal((await runSetup({context,persist:f.persist,now})).status,'needs-adapter');
 delete f.adapters['connect-vta'];const out=await runSetup({context,adapters:f.adapters,persist:f.persist,verifyReceipt,now});assert.equal(out.stage,'connect-vta');assert.equal(out.status,'needs-adapter');
 const g=fixture();g.adapters['connect-vta'].authorize=async()=>false;assert.equal((await runSetup({context,adapters:g.adapters,persist:g.persist,verifyReceipt,now})).status,'needs-authorization');assert.equal(g.executions,2);
});
test('unknown effects reconcile the same operation and never execute twice',async()=>{
 const f=fixture();let called=0,intent;f.adapters['connect-vta'].execute=async i=>{called++;intent=i;throw Error('connection lost after effect');};
 const out=await runSetup({context,adapters:f.adapters,persist:f.persist,verifyReceipt,now});assert.equal(out.status,'unconfirmed');assert.equal(f.saved.pending.operationId,intent.operationId);
 assert.equal((await runSetup({context,checkpoint:f.saved,adapters:f.adapters,persist:f.persist,verifyReceipt,now})).status,'unconfirmed');assert.equal(called,1);
 f.adapters['connect-vta'].reconcile=async i=>{assert.equal(i.operationId,intent.operationId);return receipt(i);};
 assert.equal((await runSetup({context,checkpoint:f.saved,adapters:f.adapters,persist:f.persist,verifyReceipt,now})).status,'receipts-complete');assert.equal(called,1);
});
test('audience changes, expired receipts and changed dependencies cannot reuse a checkpoint',async()=>{
 const f=fixture();await runSetup({context,adapters:f.adapters,persist:f.persist,verifyReceipt,now});
 await assert.rejects(runSetup({context:{...context,audience:'https://other.invalid'},checkpoint:f.saved,adapters:f.adapters,persist:f.persist,verifyReceipt,now}),/another context/);
 assert.equal((await runSetup({context,checkpoint:f.saved,adapters:f.adapters,persist:f.persist,verifyReceipt,now:()=>Date.parse('2031-01-01')})).status,'needs-revalidation');
 const bad=structuredClone(f.saved);bad.receipts['carry-key'].intent.dependencies.discover='altered';assert.equal((await runSetup({context,checkpoint:bad,adapters:f.adapters,persist:f.persist,verifyReceipt,now})).status,'needs-revalidation');
});
test('storage failure prevents effects; invalid returned receipt stays unconfirmed',async()=>{
 const f=fixture();await assert.rejects(runSetup({context,adapters:f.adapters,persist:async()=>{throw Error('storage');},verifyReceipt,now}),/storage/);assert.equal(f.executions,0);
 f.adapters.discover.execute=async i=>({...receipt(i),intentDigest:'changed'});assert.equal((await runSetup({context,adapters:f.adapters,persist:f.persist,verifyReceipt,now})).status,'unconfirmed');assert.ok(f.saved.pending);
});
test('concurrent starts cannot both execute against the same durable checkpoint',async()=>{
 const f=fixture();const options={context,adapters:f.adapters,persist:f.persist,verifyReceipt,now};
 const both=await Promise.allSettled([runSetup(options),runSetup(options)]);
 assert.equal(both.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(both.filter(r=>r.status==='rejected').length,1);
 assert.equal(f.executions,stages.length);
});
