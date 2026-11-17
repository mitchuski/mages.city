import {appearanceFromJSON,readAppearance} from './star-appearance.mjs';
import {kappaOf,didKeyOf,verifyRecord} from './record.js';
const input=document.querySelector('#arrival-key'),forget=document.querySelector('#forget-star'),status=document.querySelector('#star-status'),error=document.querySelector('#star-error');
const slot='mages.city:star-appearance:1';
const orb=document.querySelector('#star-orb'),panel=document.querySelector('#star-panel'),close=document.querySelector('#close-star');
function toggle(open,restore=false){panel.hidden=!open;orb.setAttribute('aria-expanded',String(open));if(open)close.focus();else if(restore)orb.focus();}
orb.addEventListener('click',()=>toggle(panel.hidden));
close.addEventListener('click',()=>toggle(false,true));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){toggle(false,true);}});
document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!e.target.closest('.star-companion'))toggle(false);});
function render(value){
 const reading=readAppearance(value);
 document.body.classList.toggle('star-equipped',!!reading);
 for(const name of ['cool','warm','sword','mage']){
  if(reading)document.body.style.setProperty('--key-'+name,reading.palette[name]);
  else document.body.style.removeProperty('--key-'+name);
 }
 status.textContent=reading?'Your key’s colours are here.':'Bring your key.';
 orb.setAttribute('aria-label',reading?'Open your Star · appearance loaded':'Open your Star');
 forget.hidden=!reading;
}
try{render(JSON.parse(sessionStorage.getItem(slot)||'null'));}catch{render(null);}
input.addEventListener('change',async()=>{
 const file=input.files[0];if(!file)return;
 input.disabled=forget.disabled=true;error.textContent='';
 try{
  const isPng=file.type==='image/png'||/\.png$/i.test(file.name);
  if(file.size>(isPng?16:2)*1024*1024)throw Error(isPng?'Choose a PNG smaller than 16 MiB':'Choose a key smaller than 2 MiB');
  const raw=isPng?keyFromPng(new Uint8Array(await file.arrayBuffer())):await file.text();
  const appearance=await appearanceFromJSON(raw);
  sessionStorage.setItem(slot,JSON.stringify(appearance));render(appearance);
  try{const r=await readKey(raw);if(r)sessionStorage.setItem(readSlot,JSON.stringify(r));else sessionStorage.removeItem(readSlot);renderReading(r);}catch{renderReading(null);}
 }catch(e){error.textContent=e.message;}
 finally{input.value='';input.disabled=forget.disabled=false;}
});
forget.addEventListener('click',()=>{
 try{sessionStorage.removeItem(slot);sessionStorage.removeItem(readSlot);render(null);renderReading(null);error.textContent='';}
 catch{error.textContent='Could not clear the saved appearance. Please try again.';}
});

const sceneColours=document.getElementById('star-scene-colours');
function syncSceneColours(){document.body.classList.toggle('star-scene-colours',sceneColours.checked);}
sceneColours.addEventListener('change',syncSceneColours);syncSceneColours();

// 2026-11-17: a City Key PNG from soulbis /star carries the key in a tEXt chunk named cityKey (base64 JSON)
function keyFromPng(u){
 if(u.length<20||u[0]!==0x89||u[1]!==0x50||u[2]!==0x4e||u[3]!==0x47)throw Error('That is not a PNG');
 const lat=b=>{let s='';for(const c of b)s+=String.fromCharCode(c);return s;};
 for(let p=8;p+12<=u.length;){const len=((u[p]<<24)|(u[p+1]<<16)|(u[p+2]<<8)|u[p+3])>>>0,type=lat(u.subarray(p+4,p+8));
  if(type==='tEXt'){const d=u.subarray(p+8,p+8+len),z=d.indexOf(0);if(z>0&&lat(d.subarray(0,z))==='cityKey'){const bin=atob(lat(d.subarray(z+1)));return new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0)));}}
  if(type==='IEND')break;p+=12+len;}
 throw Error('No City Key inside this PNG');
}

// 2026-11-17: the new key format — read the key’s address (κ), its did:key and its signed VTA record, here in the browser
const readSlot='mages.city:star-reading:1',readingEl=document.querySelector('#star-reading'),bring=document.querySelector('#star-bring');
const GLYPHS=['🐬','🧭','🌌','🧣','🛸','🐭','🌍','⭐','🌀','🔭','🗝️','🕯️','🪐','🌙','🔥','🌊'];
const glyphs=h=>[0,1,2,3].map(i=>GLYPHS[parseInt(h[i],16)]).join('');
async function readKey(raw){let j;try{j=JSON.parse(raw);}catch{return null;}
 const key=j&&j.key&&typeof j.key==='object'?j.key:(j&&j.kind==='agentprivacy.vta/1'?null:j),rec=j&&j.record?j.record:(j&&j.kind==='agentprivacy.vta/1'?j:null);
 const out={};if(key){out.kappa=await kappaOf(key);if(key.kappa&&key.kappa!==out.kappa)out.changed=true;const pk=key.identity&&key.identity.publicKeyHex;if(/^[0-9a-f]{64}$/i.test(pk||''))out.did=didKeyOf(pk);}
 if(rec){const v=await verifyRecord(rec,key);out.signed=v.ok;if(!v.ok)out.why=v.why;if(!out.kappa)out.kappa=rec.kappa;if(!out.did&&v.did)out.did=v.did;}
 return out.kappa?out:null;}
function renderReading(r){if(!readingEl)return;readingEl.textContent='';readingEl.hidden=!r;if(bring)bring.hidden=!r;if(!r)return;
 const row=(k,v,cls)=>{const dt=document.createElement('dt');dt.textContent=k;const dd=document.createElement('dd');dd.textContent=v;if(cls)dd.className=cls;readingEl.append(dt,dd);};
 const hex=r.kappa.replace(/^sha256:/,'');row('mark',glyphs(hex));row('κ',r.kappa.slice(0,19)+'…'+hex.slice(-6));if(r.did)row('did',r.did.slice(0,20)+'…');
 if(r.changed)row('key','changed after it was sealed','no');
 row('VTA record',r.signed===true?'✓ signed, names this key':r.signed===false?'✕ '+(r.why||'does not verify'):'not attached',r.signed===true?'ok':'no');}
try{renderReading(JSON.parse(sessionStorage.getItem(readSlot)||'null'));}catch{renderReading(null);}
