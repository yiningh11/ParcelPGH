import {loadParcel} from '@/lib/sources/parcels';
import {failure} from '@/lib/api';
export async function GET(_:Request,context:{params:Promise<{pin:string}>}){const id=crypto.randomUUID();try{const {pin}=await context.params;const parcel=await loadParcel(pin);return Response.json({schemaVersion:'1',requestId:id,generatedAt:new Date().toISOString(),parcel,sources:parcel.sources,warnings:parcel.warnings});}catch(e){return failure(e,id);}}
