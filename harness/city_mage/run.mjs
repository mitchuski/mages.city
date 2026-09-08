import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url)), city=path.resolve(here,'../..'), suite=path.dirname(city), framework=path.join(suite,'dual-agent-harness');
const at=new Date().toISOString(), id=at.replace(/[:.]/g,'-')+'-'+crypto.randomBytes(3).toString('hex');
const dir=path.join(here,'runs',id);fs.mkdirSync(dir,{recursive:true});
const save=(name,v)=>fs.writeFileSync(path.join(dir,name),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const scope=['mages_city/site','mages_city/gate','mages_city/portal/promise-graph.cjs','mages_city/bin','agentprivacy-mcp/lib','agentprivacy-mcp/test','agentprivacy-mcp/server.mjs','agentprivacy_master/src/lib','spellweb/src/lib','spellweb/src/types/graph.ts','spellweb/scripts/journey-roundtrip-check.mjs','dual-agent-harness/engine','dual-agent-harness/TRUSTS.md','dual-agent-harness/GROUND_RULES.md'];
function sources(){const out=[];function walk(rel){const p=path.join(suite,rel);if(fs.statSync(p).isDirectory())fs.readdirSync(p).sort().forEach(n=>walk(rel+'/'+n));else out.push({path:rel,sha256:hash(fs.readFileSync(p))});}scope.forEach(walk);for(const n of ['run.mjs','runtime.json','harness.config.mjs','setup.mjs','setup.test.mjs','checkpoint-store.mjs','checkpoint-store.test.mjs','bootstrap.mjs','bootstrap.test.mjs'])out.push({path:'mages_city/harness/city_mage/'+n,sha256:hash(fs.readFileSync(path.join(here,n)))});return out;}
const before=sources();save('sources.json',before);
function run(name,repo,args){const r=spawnSync(process.execPath,args,{cwd:path.join(suite,repo),encoding:'utf8',timeout:120000,windowsHide:true});save(name+'.stdout.txt',r.stdout??'');save(name+'.stderr.txt',r.stderr??'');return {name,repo,args,exitCode:r.status,error:r.error?.message??null,passed:r.status===0&&!r.error};}
const old=path.join(here,'frontier.json'), prior=fs.existsSync(old)?JSON.parse(fs.readFileSync(old,'utf8')):null;
const pre=prior?run('conform-before','dual-agent-harness',['engine/conform.mjs',here]):null;
const results=[
 run('setup','mages_city',['--test','harness/city_mage/setup.test.mjs','harness/city_mage/checkpoint-store.test.mjs','harness/city_mage/bootstrap.test.mjs']),
 run('front','mages_city',['bin/verify-front.mjs']),
 run('promises','mages_city',['--test','bin/promise-graph.test.mjs']),
 run('permissions','mages_city',['--test','bin/permissions.test.mjs']),
 run('journey','agentprivacy-mcp',['--test','test/journey.test.mjs','test/browser-journey.test.mjs']),
 run('carrier','spellweb',['scripts/journey-roundtrip-check.mjs'])
];
const broken=[];for(const doc of ['skill.md','orientation.md','participation.md','city-key-arrival.md','city-mage.md'])for(const m of fs.readFileSync(path.join(city,'site',doc),'utf8').matchAll(/\]\(([^)]+)\)/g)){if(/^[a-z]+:|^#/i.test(m[1]))continue;if(!fs.existsSync(path.resolve(city,'site',path.dirname(doc),m[1].split('#')[0])))broken.push({doc,target:m[1]});}
if(!fs.readFileSync(path.join(city,'site/city-mage.json')).equals(fs.readFileSync(path.join(here,'runtime.json'))))broken.push({doc:'city-mage.json',target:'runtime manifest differs from source'});
save('reading-links.json',{broken});
const stable=JSON.stringify(before)===JSON.stringify(sources());
const metric=results.filter(r=>!r.passed).length;
const measurement={metric,how:'node harness/city_mage/run.mjs; process-exit census',run:id};
const frontier={authority:'Local integration measurement only; maintained by the runtime integration owner.',updated:at,baseline:prior?.baseline??measurement,best:prior?.best??measurement,latest:{...measurement,checks:results.length,sourceStable:stable,brokenLinks:broken.length},liveSetup:'not-connected',pairedRun:false,validatedImprovements:0};
fs.writeFileSync(old,JSON.stringify(frontier,null,2)+'\n');
const conform=run('conform-after','dual-agent-harness',['engine/conform.mjs',here]);
const status=metric===0&&stable&&broken.length===0&&conform.passed&&(!pre||pre.passed)?'offline-baseline-pass':'offline-baseline-failed';
frontier.latest.status=status;frontier.latest.conformPassed=conform.passed;fs.writeFileSync(old,JSON.stringify(frontier,null,2)+'\n');
const receipt={kind:'agentprivacy.city-mage-run/1',id,at,node:process.version,status,results,conformBefore:pre,conformAfter:conform,sourceStable:stable,sourceManifest:'sources.json',liveSetup:'not-connected',pairedRun:false,heldOutValidation:false,credentialIssued:false,accessGranted:false,externalEffects:[]};save('receipt.json',receipt);
const chronicle=['# city_mage: '+status,'','Run evidence: `../runs/'+id+'/receipt.json`. Numbers are recorded in `../frontier.json`.','','The current framework conformance gate and existing local City/journey checks ran. Reading links were checked; source hashes were captured before and after. This is a deterministic integration baseline, not a paired run, held-out validation or a completed setup.','','Per-process outcomes: '+results.map(r=>r.name+'='+r.passed).join(', ')+'. Conformance after='+conform.passed+'. Consult conform-after.stderr.txt for advisories or failures; passing process checks cannot override failed conformance.','','Reversal: the older agentprivacy-dual-agent-harness is superseded; this instance uses dual-agent-harness. The template refuses to simulate unconnected paired seats.','','Open: real VTA/DID/delegation, MyTerms/TSP, task execution, website state and memory retention.','','Next action: resolve the existing VTA endpoint/profile and supported ownership interface, without creating a duplicate.','','No outward action was performed.','','(⚔️⊥⿻⊥🧙)😊',''].join('\n');
fs.mkdirSync(path.join(here,'chronicles'),{recursive:true});fs.writeFileSync(path.join(here,'chronicles',id+'.md'),chronicle,{flag:'wx'});
console.log(JSON.stringify({id,status,receipt:path.join(dir,'receipt.json'),liveSetup:receipt.liveSetup}));process.exitCode=status==='offline-baseline-pass'?0:1;
