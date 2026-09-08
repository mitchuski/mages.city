import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {bootstrap} from './bootstrap.mjs';
import {stamp} from '../../../agentprivacy-mcp/lib/kappa.mjs';

function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'city-bootstrap-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const key=stamp({version:1,palette:{cool:'#123456'},descriptions:{},privateExtension:{secret:'keep-this-private'}});
 const inputPath=path.join(dir,'key.json');fs.writeFileSync(inputPath,JSON.stringify(key));
 return {key,options:{inputPath,stateDir:path.join(dir,'instance'),subject:'fixture-only',audience:'https://example.invalid'}};
}
test('real CLI prepares and resumes original evidence without inventing service receipts',async t=>{
 const {key,options}=fixture(t);
 const cli=fileURLToPath(new URL('./bootstrap.mjs',import.meta.url));
 const args=[cli,'--input',options.inputPath,'--state-dir',options.stateDir,'--subject',options.subject,'--audience',options.audience];
 for(const resumed of [false,true]){
  const child=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true});
  assert.equal(child.status,0,child.stderr);const result=JSON.parse(child.stdout);
  assert.equal(result.resumed,resumed);assert.equal(result.nextStage,'discover');assert.equal(result.liveConnected,false);
  assert.equal(result.authenticatedWebsite,false);assert.equal(result.credentialIssued,false);
  assert.ok(!child.stdout.includes('keep-this-private'));assert.ok(!child.stdout.includes(key.kappa));
 }
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(options.stateDir,'journey.json'))).key,key);
 const checkpoint=JSON.parse(fs.readFileSync(path.join(options.stateDir,'checkpoint.json')));
 assert.equal(checkpoint.revision,1);assert.deepEqual(checkpoint.receipts,{});
});
test('changed context and retained evidence cannot resume',async t=>{
 const {options}=fixture(t);await bootstrap(options);
 await assert.rejects(bootstrap({...options,subject:'another'}),/changed/);
 const file=path.join(options.stateDir,'journey.json');const evidence=JSON.parse(fs.readFileSync(file));
 evidence.key=stamp({...evidence.key,privateExtension:{secret:'changed'}});fs.writeFileSync(file,JSON.stringify(evidence));
 await assert.rejects(bootstrap(options),/Retained journey evidence changed/);
});
test('invalid commitment and incomplete packet originals fail before creating state',async t=>{
 const {key,options}=fixture(t);
 fs.writeFileSync(options.inputPath,JSON.stringify({...key,kappa:'sha256:'+'0'.repeat(64)}));
 await assert.rejects(bootstrap(options),/kappa mismatch/);assert.equal(fs.existsSync(options.stateDir),false);
 fs.writeFileSync(options.inputPath,JSON.stringify(stamp({...key,packets:{count:1,root:'sha256:'+'a'.repeat(64)}})));
 await assert.rejects(bootstrap(options),/complete original packets/);assert.equal(fs.existsSync(options.stateDir),false);
});
test('partial preparation is retained and cannot be silently reset',async t=>{
 const {options}=fixture(t);fs.mkdirSync(options.stateDir);
 await assert.rejects(bootstrap(options));assert.equal(fs.existsSync(options.stateDir),true);
});
