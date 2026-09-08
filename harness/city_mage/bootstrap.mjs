import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseKeyInput} from '../../../agentprivacy-mcp/lib/key.mjs';
import {BUNDLE_KIND, createBundle, validateBundle} from '../../../agentprivacy-mcp/lib/journey.mjs';
import {kappaOf} from '../../../agentprivacy-mcp/lib/kappa.mjs';
import {runSetup, intentDigest} from './setup.mjs';
import {openCheckpointStore} from './checkpoint-store.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const city=path.resolve(here,'../..');
const entryFiles=['city-mage.json','city-mage.md','city-key-arrival.md','skill.md'];
function snapshot() {
  const manifest=fs.readFileSync(path.join(here,'runtime.json'),'utf8');
  if(manifest!==fs.readFileSync(path.join(city,'site/city-mage.json'),'utf8'))throw Error('Entry kit manifest is out of sync');
  return {runtime:intentDigest(JSON.parse(manifest)),files:Object.fromEntries(entryFiles.map(name=>[name,intentDigest(fs.readFileSync(path.join(city,'site',name),'utf8'))]))};
}
function loadBundle(inputPath) {
  const stat=fs.statSync(inputPath);
  if(!stat.isFile()||stat.size>16*1024*1024)throw Error('Input must be a file no larger than 16 MiB');
  const parsed=parseKeyInput(inputPath);
  if(parsed.error)throw Error(parsed.error);
  const bundle=parsed.key?.kind===BUNDLE_KIND?parsed.key:createBundle(parsed.key);
  validateBundle(bundle);
  return bundle;
}

/** Local preparation only. No service receipt is invented for local inspection. */
export async function bootstrap({inputPath,stateDir,subject,audience}) {
  if(!path.isAbsolute(inputPath)||!path.isAbsolute(stateDir))throw Error('Absolute input and private state directory paths required');
  if(typeof subject!=='string'||!subject.trim())throw Error('Explicit subject reference required; ownership is not inferred');
  const url=new URL(audience);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Audience must be an HTTPS origin');
  // Existing private parent is host-controlled. This command does not establish ACLs.
  if(!fs.statSync(path.dirname(stateDir)).isDirectory())throw Error('Existing private parent required');
  const bundle=loadBundle(inputPath), sources=snapshot();
  const context={subject,audience:url.origin,keyKappa:kappaOf(bundle.key)};
  const binding=intentDigest(context), bundleDigest=intentDigest(bundle);
  const prepared={kind:'agentprivacy.city-mage-preparation/1',context,bundleDigest,sources,ownership:'not-verified'};
  let created=false;
  try{fs.mkdirSync(stateDir,{mode:0o700});created=true;}catch(error){if(error.code!=='EEXIST')throw error;}
  const privateFile=name=>path.join(stateDir,name);
  const store=openCheckpointStore(privateFile('checkpoint.json'));
  if(created){
    // A partially written preparation is retained and fails closed on the next run.
    fs.writeFileSync(privateFile('journey.json'),JSON.stringify(bundle,null,2)+'\n',{flag:'wx',mode:0o600});
    fs.writeFileSync(privateFile('preparation.json'),JSON.stringify(prepared,null,2)+'\n',{flag:'wx',mode:0o600});
    await store.persist({kind:'agentprivacy.city-mage-checkpoint/1',binding,revision:1,receipts:{},pending:null},{expectedRevision:0});
  }else{
    const saved=JSON.parse(fs.readFileSync(privateFile('preparation.json'),'utf8'));
    if(intentDigest(saved)!==intentDigest(prepared))throw Error('Preparation context, evidence or entry-kit sources changed; retain this instance and prepare a new directory');
    const original=JSON.parse(fs.readFileSync(privateFile('journey.json'),'utf8'));
    validateBundle(original);
    if(intentDigest(original)!==bundleDigest)throw Error('Retained journey evidence changed');
    if(!store.load())throw Error('Incomplete preparation: checkpoint missing; retain this directory for inspection');
  }
  // This local command has no live verifier or adapters. The host connects these later.
  const result=await runSetup({context,checkpoint:store.load(),persist:store.persist});
  return {kind:'agentprivacy.city-mage-bootstrap-result/1',status:'local-preparation-complete',resumed:!created,
    nextStage:'discover',setupStatus:result.status,reason:result.reason,
    evidence:{packets:bundle.packets.length,taskDocuments:bundle.taskDocuments.length},
    authenticatedWebsite:false,credentialIssued:false,liveConnected:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{
    const args=process.argv.slice(2);
    if(args.length===1&&args[0]==='--help'){
      console.log('node harness/city_mage/bootstrap.mjs --input <absolute JSON/PNG/bundle> --state-dir <new absolute private directory> --subject <unverified subject reference> --audience https://mages.city');
    }else{
      const allowed=new Set(['--input','--state-dir','--subject','--audience']), values={};
      for(let i=0;i<args.length;i+=2){if(!allowed.has(args[i])||values[args[i]]!==undefined||!args[i+1])throw Error('Invalid arguments; use --help');values[args[i]]=args[i+1];}
      if(Object.keys(values).length!==4)throw Error('Four explicit arguments required; use --help');
      console.log(JSON.stringify(await bootstrap({inputPath:values['--input'],stateDir:values['--state-dir'],subject:values['--subject'],audience:values['--audience']}),null,2));
    }
  }catch(error){console.error('city_mage bootstrap failed: '+error.message);process.exitCode=1;}
}
