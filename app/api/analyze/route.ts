import {AnalyzeRequestSchema} from '@/lib/schemas';
import {loadParcel} from '@/lib/sources/parcels';
import {analyze} from '@/lib/analysis/engine';
import {body,failure} from '@/lib/api';
export async function POST(request:Request){const id=crypto.randomUUID();try{const data=AnalyzeRequestSchema.parse(await body(request));return Response.json(analyze(await loadParcel(data.pin,data.refresh),data.proposal,id));}catch(e){return failure(e,id);}}
