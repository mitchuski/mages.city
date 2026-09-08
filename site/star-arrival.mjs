import {appearanceFromJSON,readAppearance} from './star-appearance.mjs';
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
  if(file.size>2*1024*1024)throw Error('Choose a JSON key smaller than 2 MiB');
  const appearance=await appearanceFromJSON(await file.text());
  sessionStorage.setItem(slot,JSON.stringify(appearance));render(appearance);
 }catch(e){error.textContent=e.message;}
 finally{input.value='';input.disabled=forget.disabled=false;}
});
forget.addEventListener('click',()=>{
 try{sessionStorage.removeItem(slot);render(null);error.textContent='';}
 catch{error.textContent='Could not clear the saved appearance. Please try again.';}
});

const sceneColours=document.getElementById('star-scene-colours');
function syncSceneColours(){document.body.classList.toggle('star-scene-colours',sceneColours.checked);}
sceneColours.addEventListener('change',syncSceneColours);syncSceneColours();
