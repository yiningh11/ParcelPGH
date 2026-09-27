import { AnalysisResultSchema,type Finding,type ParcelFacts,type Proposal } from '../schemas';
import {CODE_SOURCE,RULESET_VERSION,USE_DISTRICTS,baseUseAllowed} from '../rules/catalog';
const points={pass:0,not_applicable:0,unknown:0,concern:5,major:15,apparent_conflict:25};
export const unassessed=['site.undermined','site.flood','zoning.height','zoning.setbacks','zoning.parking','zoning.lot_coverage','zoning.overlays','zoning.nonconformity','finance'];
export function scoreFindings(findings:Finding[]){
 const critical=new Set(['parcel.identity','zoning.base','zoning.use','site.slope25','site.landslide']);
 const criticalUnknownIds=findings.filter(f=>critical.has(f.id)&&f.status==='unknown').map(f=>f.id);
 for(const id of critical)if(!findings.some(f=>f.id===id))criticalUnknownIds.push(id);
 const seen=new Set<string>();const deductions: {findingId:string,points:number}[]=[];
 for(const f of findings){const key=f.conditionId??f.id;if(points[f.status]&&!seen.has(key)){deductions.push({findingId:f.id,points:points[f.status]});seen.add(key);}}
 const capApplied=findings.some(f=>f.id.startsWith('zoning.')&&f.status==='apparent_conflict');
 const raw=Math.max(0,100-deductions.reduce((n,d)=>n+d.points,0));
 const value=criticalUnknownIds.length?null:Math.min(raw,capApplied?49:100);
 return {value,label:value===null?'unavailable' as const:value>=80?'fewer_identified_constraints' as const:value>=50?'additional_review_likely' as const:'major_identified_constraint' as const,scoringVersion:'SCORING_V1',assessedChecks:findings.filter(f=>f.status!=='unknown').length,eligibleChecks:findings.length,deductions,criticalUnknownIds,capApplied};
}
export function analyze(parcel:ParcelFacts,proposal:Proposal,requestId='local',generatedAt=new Date().toISOString()){
 const findings:Finding[]=[];
 const add=(f:Omit<Finding,'penalty'>)=>findings.push({...f,penalty:points[f.status]});
 add({id:'parcel.identity',category:'regulatory',status:parcel.cityVerified?'pass':'unknown',title:'Parcel identity & city coverage',summary:parcel.cityVerified?'Official parcel polygon matched within Pittsburgh’s mapped zoning coverage.':'City coverage requires verification.',appliesTo:'parcel',sourceIds:['parcel','zoning'],measuredValue:Math.round(parcel.areaSqFt),units:'sq ft',calculation:'Geodesic polygon area; city coverage requires at least 99% mapped zoning overlap.',limitation:'GIS boundaries are not a legal survey.',nextStep:'Confirm legal lot boundaries with a surveyor before design.'});
 const single=parcel.cityVerified&&parcel.zoningAvailable&&parcel.zoningDistricts.length===1;
 const code=single?parcel.zoningDistricts[0].code:undefined;
 add({id:'zoning.base',category:'regulatory',status:single?'pass':'unknown',title:'Mapped base zoning',summary:single?`${code} is the mapped base district.`:'Missing or split zoning needs City interpretation.',appliesTo:'parcel',measuredValue:parcel.zoningDistricts.map(d=>`${d.code} (${d.share.toFixed(1)}%)`).join(', ')||'Unavailable',sourceIds:['zoning'],limitation:'Base zoning does not resolve overlays, map amendments or site-specific decisions.',nextStep:'Confirm the current designation with Pittsburgh Zoning.'});
 const base=code?.split('-')[0]??'';
 const supported=single&&USE_DISTRICTS.includes(base)&&proposal.scope==='new_construction';
 const allowed=supported&&baseUseAllowed(base,proposal.units);
 // Four-plus-unit RM standards require further site-plan/use-standard review; do not clear them.
 const needsStandards=supported&&allowed&&proposal.units>=4;
 const status=!supported||needsStandards?'unknown':allowed?'pass':'apparent_conflict';
 add({id:'zoning.use',category:'regulatory',status,title:'Proposed residential use',summary:!supported?'This scope or district is outside the implemented base-use screen. Verify existing rights and applicable rules.':needsStandards?'Multi-unit RM use requires additional standards and site-plan review; this prototype cannot resolve them.':allowed?`${proposal.units}-unit residential use is listed in the ${base} base-use table. Other requirements still apply.`:`${proposal.units}-unit residential use is not listed for ${base}; an apparent base-table conflict requires City review.`,appliesTo:'proposal',sourceIds:['code.use','zoning'],ruleId:RULESET_VERSION,measuredValue:`${proposal.units} unit${proposal.units===1?'':'s'} / ${code??'unknown district'}`,calculation:'§911.01.B/F and §911.02 residential use table; §911.04A.69 single-unit standards. New construction only.',limitation:'Not a zoning approval. Overlays, accessory units, nonconforming rights, variances and special site conditions are not resolved.',nextStep:'Ask Pittsburgh Zoning to confirm the use classification, overlays and any applicable relief.',changedByFields:['scope','buildingType','units']});
 add({id:'zoning.lot_area',category:'regulatory',status:'unknown',title:'Minimum lot area',summary:'Lot-size exemptions and applicability require verification; no lot-size penalty is assigned.',appliesTo:'proposal',sourceIds:['parcel','code.lot'],measuredValue:Math.round(parcel.reportedAreaSqFt),units:'sq ft reported',limitation:'2025 amendments changed minimums. Nonconforming-lot and other exceptions are not modeled.',nextStep:'Have City staff review §903.03 and applicable lot exceptions.',changedByFields:['scope','buildingType','units']});
 for(const [id,title] of [['slope','Steep slopes · 25%+'],['landslide','Mapped landslide-prone area']] as const){
 const l=parcel.layers.find(l=>l.id===id);const hit=!!l&&l.overlapSqFt>1&&l.overlapPercent>0.1;
 add({id:id==='slope'?'site.slope25':'site.landslide',category:'physical',status:!l?.available?'unknown':hit?'major':'pass',title,summary:!l?.available?'The source could not be assessed. This is not a clear result.':hit?`${l.overlapPercent.toFixed(1)}% of the parcel intersects the mapped layer.`:'No material overlap found in this mapped layer.',appliesTo:'parcel',sourceIds:[id,'parcel'],measuredValue:l?.available?Math.round(l.overlapSqFt):'Unavailable',units:l?.available?'sq ft overlap':undefined,calculation:'Union of exact parcel/layer intersections; geodesic area. Material overlap >1 sq ft and >0.1% of parcel.',limitation:'Parcel exposure only. Footprint placement and unmapped hazards remain unknown.',nextStep:hit?'Ask a geotechnical professional to assess the site and proposed disturbance.':'Confirm site conditions during due diligence.'});
 }
 const sources=[...parcel.sources,CODE_SOURCE,{id:'code.lot',title:'Pittsburgh Code §903.03 · Development subdistricts',url:'https://ecode360.com/45474194',retrievedAt:CODE_SOURCE.retrievedAt,mode:'reference' as const}];
 return AnalysisResultSchema.parse({schemaVersion:'1',requestId,generatedAt,rulesetVersion:RULESET_VERSION,snapshotId:parcel.snapshotId,parcel,proposal,score:scoreFindings(findings),findings,sources,unassessedCheckIds:unassessed,warnings:parcel.warnings});
}
export function compare(parcel:ParcelFacts,scenarioA:Proposal,scenarioB:Proposal,requestId='local'){
 const now=new Date().toISOString(),a=analyze(parcel,scenarioA,requestId,now),b=analyze(parcel,scenarioB,requestId,now);
 const changedFields=(Object.keys(scenarioA).concat(Object.keys(scenarioB)) as (keyof Proposal)[]).filter((key,i,arr)=>arr.indexOf(key)===i&&scenarioA[key]!==scenarioB[key]);
 const changes=a.findings.flatMap(before=>{const after=b.findings.find(f=>f.id===before.id)!;return before.status===after.status&&before.summary===after.summary?[]:[{findingId:before.id,title:before.title,beforeStatus:before.status,afterStatus:after.status,reasonFields:changedFields.filter(k=>after.changedByFields?.includes(k)),explanation:after.summary,sourceIds:after.sourceIds,nextStep:after.nextStep}];});
 const sameCoverage=a.findings.every((f,i)=>(f.status==='unknown')===(b.findings[i].status==='unknown'));
 return {schemaVersion:'1',requestId,generatedAt:now,a,b,changes,changedFields,unchangedFindingIds:a.findings.filter(f=>!changes.some(c=>c.findingId===f.id)).map(f=>f.id),scoreDifference:sameCoverage&&a.score.value!==null&&b.score.value!==null?b.score.value-a.score.value:null};
}
export type Comparison=ReturnType<typeof compare>;
export function explain(result:ReturnType<typeof analyze>){return {generatedBy:'template' as const,overview:result.score.value===null?'Critical checks still need verification. Review the unknowns before comparing scores.':'This score summarizes only identified friction in the implemented checks. Review the evidence and unresolved requirements.',nextSteps:[...result.findings].sort((a,b)=>({apparent_conflict:5,major:4,unknown:3,concern:2,pass:1,not_applicable:0}[b.status]-{apparent_conflict:5,major:4,unknown:3,concern:2,pass:1,not_applicable:0}[a.status])).filter(f=>f.status!=='pass'&&f.nextStep).map(f=>({findingId:f.id,text:f.nextStep,sourceIds:f.sourceIds})),citedSourceIds:[...new Set(result.findings.flatMap(f=>f.sourceIds))]};}
