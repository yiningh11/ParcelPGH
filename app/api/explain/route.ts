import {AnalyzeRequestSchema} from '@/lib/schemas';
import {loadParcel} from '@/lib/sources/parcels';
import {analyze,explain} from '@/lib/analysis/engine';
import {body,failure} from '@/lib/api';
// Recompute authoritative findings; never accept client-written statuses or penalties.
export async function POST(request:Request){const id=crypto.randomUUID();try{const data=AnalyzeRequestSchema.parse(await body(request));return Response.json({schemaVersion:'1',requestId:id,...explain(analyze(await loadParcel(data.pin),data.proposal,id))});}catch(e){return failure(e,id);}}
