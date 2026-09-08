import fs from 'node:fs';
const source=new URL('./runtime.json',import.meta.url), destination=new URL('../../site/city-mage.json',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(source,'utf8'));
if(manifest.name!=='city_mage'||manifest.liveComplete!==false)throw Error('Review capability status before synchronizing a changed readiness claim');
fs.copyFileSync(source,destination);
console.log('City entry-kit runtime manifest synchronized. No deployment performed.');
