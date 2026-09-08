// Trusted host adapters supply authorization, execution, reconciliation and receipt verification.
// A City Key or remote page cannot supply those functions. No adapters are shipped live here.
import crypto from 'node:crypto';
import fs from 'node:fs';
const plan=JSON.parse(fs.readFileSync(new URL('./runtime.json',import.meta.url),'utf8'));
const canon=v=>Array.isArray(v)?'['+v.map(canon).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}':JSON.stringify(v);
const digest=v=>'sha256:'+crypto.createHash('sha256').update(canon(v)).digest('hex');
const copy=v=>JSON.parse(JSON.stringify(v));

/** Resumable orchestration. Checkpoints are private; cached receipts are never trusted on load. */
export async function runSetup({context,checkpoint=null,adapters={},verifyReceipt,persist,now=()=>Date.now()}) {
  if(!context||typeof context.subject!=='string'||!context.subject||typeof context.audience!=='string'||!context.audience||!/^sha256:[a-f0-9]{64}$/.test(context.keyKappa))throw Error('Subject, audience and key commitment required');
  if(typeof persist!=='function')throw Error('Durable private checkpoint storage required');
  const binding=digest({subject:context.subject,audience:context.audience,keyKappa:context.keyKappa});
  const state=checkpoint?copy(checkpoint):{kind:'agentprivacy.city-mage-checkpoint/1',binding,revision:0,receipts:{},pending:null};
  if(state.kind!=='agentprivacy.city-mage-checkpoint/1'||state.binding!==binding||!state.receipts||typeof state.receipts!=='object'||Array.isArray(state.receipts))throw Error('Checkpoint belongs to another context or has an unsupported format');
  if(!Number.isSafeInteger(state.revision)||state.revision<0)throw Error('Checkpoint revision required');
  const commit=async()=>{
    const expectedRevision=state.revision;
    const next={...copy(state),revision:expectedRevision+1};
    // Storage must atomically compare revision and write before returning.
    const saved=await persist(next,{expectedRevision});
    if(saved?.revision!==next.revision)throw Error('Storage did not confirm the checkpoint revision');
    state.revision=next.revision;
  };
  const stop=(status,stage,reason)=>({status,stage,reason,checkpoint:copy(state),authenticatedWebsite:false});
  if(typeof verifyReceipt!=='function')return stop('needs-adapter',null,'Receipt verification is not connected');
  const valid=async(receipt,intent)=>{
    if(!receipt||receipt.intentDigest!==digest(intent)||receipt.status!=='applied'||typeof receipt.id!=='string'||!receipt.id||!Number.isFinite(Date.parse(receipt.validUntil))||Date.parse(receipt.validUntil)<=now())return false;
    const verified=await verifyReceipt(copy(receipt),copy(intent));
    return verified?.valid===true;
  };
  for(const stage of plan.stages){
    const deps=Object.fromEntries(stage.requires.map(id=>[id,state.receipts[id]?.receipt?.id]));
    if(Object.values(deps).some(id=>!id))return stop('blocked',stage.id,'Required predecessor receipt missing');
    const base={stage:stage.id,effect:stage.effect,binding,dependencies:deps};
    const cached=state.receipts[stage.id];
    if(cached){
      const expected={...base,operationId:cached.intent?.operationId};
      if(typeof expected.operationId!=='string'||canon(expected)!==canon(cached.intent)||!(await valid(cached.receipt,cached.intent)))return stop('needs-revalidation',stage.id,'Saved receipt changed, expired, revoked or no longer verifies');
      continue;
    }
    const adapter=adapters[stage.id];
    if(!adapter)return stop('needs-adapter',stage.id,'Live stage adapter is not connected');
    let intent;
    let receipt;
    if(state.pending){
      intent=state.pending;
      if(intent.stage!==stage.id||canon({...base,operationId:intent.operationId})!==canon(intent))return stop('blocked',stage.id,'Pending operation differs from current context');
      if(typeof adapter.reconcile!=='function')return stop('unconfirmed',stage.id,'Reconcile the saved operation before retrying its effect');
      try {receipt=await adapter.reconcile(copy(intent));}catch{return stop('unconfirmed',stage.id,'Reconciliation failed');}
    }else{
      intent={...base,operationId:crypto.randomUUID()};
      if(!['read','local'].includes(stage.effect)){
        if(typeof adapter.authorize!=='function'||(await adapter.authorize(copy(intent)))!==true)return stop('needs-authorization',stage.id,'No authorization for this exact stage intent');
      }
      if(typeof adapter.execute!=='function')return stop('needs-adapter',stage.id,'Execution adapter is not connected');
      state.pending=intent;
      await commit(); // Must succeed before any possibly mutating call.
      try{receipt=await adapter.execute(copy(intent));}catch{return stop('unconfirmed',stage.id,'Effect outcome is unknown; retain operation id and reconcile');}
    }
    if(!(await valid(receipt,intent)))return stop('unconfirmed',stage.id,'No current verified effect receipt');
    state.receipts[stage.id]={intent,receipt:copy(receipt)};state.pending=null;
    await commit();
  }
  if(state.pending)return stop('blocked',state.pending.stage,'Unresolved operation remains in the checkpoint');
  return stop('receipts-complete',null,'All configured stage receipts verified. Website authentication and access still belong to the actual website service.');
}
export {digest as intentDigest};
