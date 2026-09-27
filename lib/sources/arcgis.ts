import { SOURCES,type SourceKey } from './config';
import { validGeometry } from '../geo';
import type { Geometry,SourceRecord } from '../schemas';
import type { Feature } from 'geojson';
export class ServiceError extends Error {constructor(message:string,public status=503){super(message);}}
export async function query(id:SourceKey,params:Record<string,string>){
 const source=SOURCES[id];const url=new URL(source.url+'/query');
 url.search=new URLSearchParams({f:'geojson',where:'1=1',outFields:source.fields,outSR:'4326',returnGeometry:'true',...params}).toString();
 const response=await fetch(url,{signal:AbortSignal.timeout(8000),cache:'no-store'});
 if(!response.ok)throw new ServiceError(`${id} service returned HTTP ${response.status}`);
 const data=await response.json();if(data.error)throw new ServiceError(`${id} service could not complete the query`);
 if(!Array.isArray(data.features)||data.exceededTransferLimit || data.properties?.exceededTransferLimit)throw new ServiceError(`${id} returned incomplete geometry`);
 const features:Feature<Geometry>[]=data.features.map((f:Feature)=>({...f,geometry:validGeometry(f.geometry)}));
 return {features,source:{id,title:source.title,url:source.url,queryUrl:url.toString(),retrievedAt:new Date().toISOString(),mode:'live' as const} satisfies SourceRecord};
}
export function spatialQuery(g:Geometry){
 // An envelope retrieves a superset; exact polygon intersections are computed locally.
 const coordinates=g.type==='Polygon'?g.coordinates.flat():g.coordinates.flat(2);
 const xs=coordinates.map(p=>p[0]),ys=coordinates.map(p=>p[1]);
 return {geometry:JSON.stringify({xmin:Math.min(...xs),ymin:Math.min(...ys),xmax:Math.max(...xs),ymax:Math.max(...ys),spatialReference:{wkid:4326}}),geometryType:'esriGeometryEnvelope',inSR:'4326',spatialRel:'esriSpatialRelIntersects'};
}
