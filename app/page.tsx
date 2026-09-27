import Workspace from '@/components/workspace';
import snapshots from '@/fixtures/public-snapshots/parcels.json';
import {ParcelFactsSchema,type ParcelFacts} from '@/lib/schemas';
import {analyze} from '@/lib/analysis/engine';
import {loadParcel} from '@/lib/sources/parcels';
export default async function Page({searchParams}:{searchParams:Promise<{pin?:string}>}){const {pin}=await searchParams;const sample=ParcelFactsSchema.safeParse(snapshots[0]);let parcel:ParcelFacts|null=sample.success?{...sample.data,sources:sample.data.sources.map(s=>({...s,mode:s.mode==='unavailable'?'unavailable' as const:'snapshot' as const}))}:null;if(pin){try{parcel=await loadParcel(pin);}catch{parcel=null;}}const initial=parcel?analyze(parcel,{scope:'new_construction',buildingType:'small_multifamily',units:3,stories:2,heightFt:28,footprintSqFt:1400},'initial-snapshot'):null;return <Workspace initialResult={initial}/>;}
