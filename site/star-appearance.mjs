// Appearance only. Never derive authentication, authority or trust from a key.
const defaults={cool:'#141a3d',warm:'#f0eee8',sword:'#e8523a',mage:'#4dd9e8'};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const canon=x=>Array.isArray(x)?'['+x.map(canon).join(',')+']':object(x)?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canon(x[k])).join(',')+'}':JSON.stringify(x);
function bounded(x,depth=0){
 if(depth>40)throw Error('City Key nesting is too deep');
 if(typeof x==='number'&&!Number.isFinite(x))throw Error('Invalid number');
 if(x&&typeof x==='object')for(const v of Object.values(x))bounded(v,depth+1);
}
export async function appearanceFromJSON(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>2*1024*1024)throw Error('Choose a JSON file smaller than 2 MiB');
 let value;try{value=JSON.parse(text);}catch{throw Error('The file is not valid JSON');}
 bounded(value);
 const key=value?.kind==='agentprivacy.journey-bundle/1'?value.key:value;
 if(!object(key)||key.version!==1)throw Error('Expected a City Key v1 or private journey bundle');
 if(key.kappa!==undefined){
  const content={...key};delete content.kappa;
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canon(content)));
  const derived='sha256:'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  if(key.kappa!==derived)throw Error('City Key commitment does not match its content');
 }
 // Nothing else crosses this boundary: no DID, commitment, evidence or private extension.
 const palette={};
 for(const name of Object.keys(defaults)){
  const color=key.palette?.[name];
  if(color!==undefined&&(typeof color!=='string'||!/^#[a-f0-9]{6}$/i.test(color)))throw Error('Palette colours must use six-digit hex values');
  palette[name]=color?.toLowerCase()??defaults[name];
 }
 return {kind:'vta-star.appearance/1',palette};
}
export function readAppearance(value){
 if(value?.kind!=='vta-star.appearance/1'||!object(value.palette))return null;
 const palette={};for(const name of Object.keys(defaults)){
  const c=value.palette[name];if(typeof c!=='string'||!/^#[a-f0-9]{6}$/i.test(c))return null;palette[name]=c.toLowerCase();
 }
 return {kind:'vta-star.appearance/1',palette};
}
