import { area, booleanValid, feature, featureCollection, intersect, union } from '@turf/turf';
import { GeometrySchema, type Geometry } from './schemas';
export function validGeometry(value:unknown):Geometry {const g=GeometrySchema.parse(value) as Geometry;if(!booleanValid(feature(g)) || area(g)<=0)throw new Error('Invalid or empty provider polygon');return g;}
export const squareFeet=(g:Geometry)=>area(g)*10.7639104167;
export function overlap(parcel:Geometry,geometries:Geometry[]){
 const clipped=geometries.map(g=>intersect(featureCollection([feature(parcel),feature(g)]))).filter(g=>g!==null);
 const combined=clipped.length>1?union(featureCollection(clipped)):clipped[0];
 const geometry=combined?.geometry??null;
 const overlapSqFt=geometry?squareFeet(geometry):0;
 return {geometry,overlapSqFt,overlapPercent:Math.min(100,overlapSqFt/squareFeet(parcel)*100)};
}
