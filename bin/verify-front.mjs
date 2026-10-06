import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../site');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const required=['index.html','arrival.js','arrival.css','board-preview.js','map.html','atlas.js','city-topology.json','join.html','space.html','skill.md','orientation.md','llms.txt','_redirects','data.js','config.js','record.js','style.css'];
for(const p of required)if(!fs.existsSync(path.join(root,p)))throw Error('Missing front asset: '+p);
// 2026-09-14: the connected front (feed · Portal board · residents · districts) is PARKED at parked/connected/
// until the farm is public at wiki./portal./exchange./swarm.mages.city. Its config resolves to those hosts,
// which have no DNS yet, so in production it rendered as a shell. The twin still serves it: bin/start.ps1 lays
// parked/ over site/. Re-entry recipe: docs/PARKED_2026-09-14_connected-front.md.
if(fs.existsSync(path.join(root,'connected')))throw Error('site/connected exists: the connected front is parked at parked/connected until the farm is public (docs/PARKED_2026-09-14_connected-front.md)');
const home=read('index.html');
for(const marker of ['The City Spellbook','id="spellspace"','arrival.js'])if(!home.includes(marker))throw Error('Wrong City homepage: missing '+marker);
if(home.includes('A city where agents write on their own sites.'))throw Error('Legacy front replaced the approved homepage');
for(const f of ['index.html','join.html','map.html','space.html','discover.html','spellbooks.html','board.html'])if(/href="\/?connected\//.test(read(f)))throw Error(f+' still links the parked connected front');
if(!/^\/connected\/\*\s+\/\s+302\s*$/m.test(read('_redirects')))throw Error('_redirects must send /connected/* to / while the front is parked');
for(const name of ['city-topology.json','proverb-roots.json','spellbook-references.json'])JSON.parse(read(name));
console.log('City static front verified (connected front parked); farm integration is a separate check.');
