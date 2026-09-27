import { randomUUID } from 'node:crypto';
import { query,spatialQuery,ServiceError } from './arcgis';
import { SOURCES } from './config';
import { overlap,squareFeet } from '../geo';
import { ParcelFactsSchema,PinSchema,type ParcelFacts,type SourceRecord } from '../schemas';
import snapshots from '../../fixtures/public-snapshots/parcels.json';
const cache=new Map<string,{time:number,facts:ParcelFacts}>();
export async function loadParcel(input:string,refresh=false):Promise<ParcelFacts>{
 const pin=PinSchema.parse(input);const stored=cache.get(pin);
 if(!refresh&&stored&&Date.now()-stored.time<86400000)return {...stored.facts,sources:stored.facts.sources.map(s=>s.mode==='live'?{...s,mode:'cached'}:s)};
 const fallback=(snapshots as unknown as ParcelFacts[]).find(p=>p.pin===pin);
 let parcel;
 try {parcel=await query('parcel',{where:`PIN = '${pin}' OR MAPBLOCKLOT = '${pin}'`});}
 catch(e){if(fallback)return {...ParcelFactsSchema.parse(fallback),sources:fallback.sources.map(s=>({...s,mode:s.mode==='unavailable'?'unavailable':'snapshot'})),warnings:[...fallback.warnings,'Live parcel lookup failed. Showing a dated public-data snapshot.']};throw e;}
 if(parcel.features.length===0)throw new ServiceError('No parcel matched that PIN. Use the full official PIN, or a sample below.',404);
 if(parcel.features.length!==1)throw new ServiceError('Parcel identity is ambiguous. Use the full official PIN.',422);
 const f=parcel.features[0];const geometry=f.geometry;const sources:SourceRecord[]=[parcel.source];const warnings:string[]=[];
 const params=spatialQuery(geometry);
 const responses=await Promise.allSettled(['zoning','slope','landslide'].map(id=>query(id as 'zoning'|'slope'|'landslide',params)));
 const zoningDistricts:ParcelFacts['zoningDistricts']=[];const layers:ParcelFacts['layers']=[];
 for(let i=0;i<responses.length;i++){
 const id=(['zoning','slope','landslide'] as const)[i],r=responses[i];
 if(r.status==='rejected'){
 sources.push({id,title:SOURCES[id].title,url:SOURCES[id].url,retrievedAt:new Date().toISOString(),mode:'unavailable',error:'Source unavailable or geometry incomplete.'});
 warnings.push(`${SOURCES[id].title} could not be assessed.`);
 if(id!=='zoning')layers.push({id,available:false,geometry:null,overlapSqFt:0,overlapPercent:0});continue;}
 sources.push(r.value.source);
 try {
 if(id==='zoning'){
 const groups=new Map<string,typeof r.value.features>();
 for(const z of r.value.features){const code=z.properties?.zon_new;if(typeof code!=='string'||!code.trim())throw new Error('Missing district code');groups.set(code,[...(groups.get(code)??[]),z]);}
 for(const [code,features] of groups){const hit=overlap(geometry,features.map(x=>x.geometry));if(hit.geometry&&hit.overlapSqFt>1&&hit.overlapPercent>0.1)zoningDistricts.push({code,share:hit.overlapPercent,geometry:hit.geometry});}
 }else {layers.push({id,available:true,...overlap(geometry,r.value.features.map(x=>x.geometry))});}
 }catch {sources[sources.length-1]={...r.value.source,mode:'unavailable',error:'Could not measure provider geometry.'};if(id==='zoning')zoningDistricts.length=0;else layers.push({id,available:false,geometry:null,overlapSqFt:0,overlapPercent:0});}
 }
 const zoningAvailable=sources.find(s=>s.id==='zoning')?.mode!=='unavailable';
 const coverage=zoningDistricts.reduce((s,d)=>s+d.share,0);
 const cityVerified=zoningAvailable&&coverage>=99;
 if(zoningAvailable&&coverage<1)throw new ServiceError('This parcel is outside mapped City of Pittsburgh zoning coverage.',422);
 if(!cityVerified)warnings.push('City coverage could not be fully verified from the municipal zoning map.');
 if(zoningDistricts.length>1)warnings.push('Multiple mapped zoning districts intersect this parcel; interpretation requires City review.');
 const facts=ParcelFactsSchema.parse({snapshotId:randomUUID(),pin:String(f.properties?.PIN),geometry,areaSqFt:squareFeet(geometry),reportedAreaSqFt:Number(f.properties?.SHAPE_Area)||squareFeet(geometry),city:'Pittsburgh',cityVerified,zoningDistricts,zoningAvailable,layers,sources,warnings});
 if(cache.size>=100)cache.delete(cache.keys().next().value!);cache.set(pin,{time:Date.now(),facts});return facts;
}
