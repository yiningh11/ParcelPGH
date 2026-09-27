import {loadParcel} from '../lib/sources/parcels';
import {writeFile,readFile} from 'node:fs/promises';
async function main(){const existing=JSON.parse(await readFile('fixtures/public-snapshots/parcels.json','utf8'));for(const pin of process.argv.slice(2)){const p=await loadParcel(pin,true);console.log(pin,p.zoningDistricts.map(d=>d.code),p.layers.map(l=>[l.id,l.available,l.overlapPercent]));existing.push(p);}await writeFile('fixtures/public-snapshots/parcels.json',JSON.stringify(existing,null,2)+'\n');}main();
