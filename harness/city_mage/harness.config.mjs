const unconnected = () => { throw Error('Paired runtime adapters are not connected; run the offline baseline.'); };
export default {
  name:'city_mage', door:'first-person', mode:'offline-baseline',
  objective:{
    metric:'Failed local process checks; lower is better. Not a live-readiness or privacy score.',
    gate:'Execute the complete fixed local check list, retain logs, and reject source drift.',
    hardConstraint:'No simulated setup, credential, permission, paired run or website authentication may be reported as real.',
    canary:'The existing journey, permission and promise fixtures supply positive and negative local cases. No canary claims a live VTA.'
  },
  heldApartRule:'This primary-authored baseline is not held-out validation. Future proposer and prover seats must be isolated; proposals use scratch copies and never choose verifier witnesses.',
  keystoneOnlyWrites:['frontier.json','claims_register.md','manifest.yaml'],
  finders:[{lens:'reuse-and-resume',hint:'Reuse existing VTA and City Key machinery.'},{lens:'disclosure-and-authority',hint:'Separate approved projection from private state and actual authority.'}],
  prompts:Object.fromEntries(['measure','propose','holdApart','assay','critic','chronicle'].map(k=>[k,unconnected])),
  schemas:Object.fromEntries(['measure','proposal','gap','verdict','critic'].map(k=>[k,{type:'object',required:['status'],properties:{status:{type:'string'}}}])),
  conformChecks:[f=>f.liveSetup==='not-connected'&&f.pairedRun===false?[]:['Baseline must retain its live and paired limitations']]
};
