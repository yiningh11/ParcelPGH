import {CompareRequestSchema} from '@/lib/schemas';
import {loadParcel} from '@/lib/sources/parcels';
import {compare} from '@/lib/analysis/engine';
import {body,failure} from '@/lib/api';
export async function POST(request:Request){const id=crypto.randomUUID();try{const data=CompareRequestSchema.parse(await body(request));return Response.json(compare(await loadParcel(data.pin),data.scenarioA,data.scenarioB,id));}catch(e){return failure(e,id);}}
