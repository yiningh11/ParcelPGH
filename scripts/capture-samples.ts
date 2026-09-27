import {writeFile} from 'node:fs/promises';
import {loadParcel} from '../lib/sources/parcels';
async function main(){
const pins=process.argv.slice(2);
const results=[];
for(const pin of pins){const facts=await loadParcel(pin,true);results.push(facts);console.log(pin,facts.zoningDistricts.map(z=>z.code),facts.layers.map(l=>[l.id,l.available,l.overlapPercent]));}
await writeFile('fixtures/public-snapshots/parcels.json',JSON.stringify(results,null,2)+'\n');

}
main().catch(e=>{console.error(e);process.exit(1)});
