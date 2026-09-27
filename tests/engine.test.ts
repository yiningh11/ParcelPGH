import {describe,it,expect} from 'vitest';
import {analyze,compare,scoreFindings,explain} from '../lib/analysis/engine';
import {ParcelFactsSchema,ProposalSchema,type Proposal} from '../lib/schemas';
import snapshots from '../fixtures/public-snapshots/parcels.json';
import {overlap,validGeometry} from '../lib/geo';
const parcel=ParcelFactsSchema.parse(snapshots[0]);
const proposal:Proposal={scope:'new_construction',buildingType:'small_multifamily',units:3,stories:2};
describe('public snapshot and deterministic screening',()=>{
 it('renders a real polygon and evaluates the three-unit base-use case',()=>{const r=analyze(parcel,proposal);expect(r.parcel.pin).toBe('0083A00188000000');expect(r.score.value).toBe(100);expect(r.score.assessedChecks).toBe(5);expect(r.findings.find(f=>f.id==='zoning.lot_area')?.status).toBe('unknown');});
 it('compares A/B on one source snapshot, preserving physical findings',()=>{const r=compare(parcel,proposal,{...proposal,units:4});expect(r.b.score.value).toBe(49);expect(r.scoreDifference).toBe(-51);expect(r.a.snapshotId).toBe(r.b.snapshotId);expect(r.a.sources).toEqual(r.b.sources);expect(r.changes.map(c=>c.findingId)).toEqual(['zoning.use']);expect(r.changes[0].reasonFields).toEqual(['units']);expect(r.a.findings.filter(f=>f.category==='physical')).toEqual(r.b.findings.filter(f=>f.category==='physical'));});
 it('does not change rules for unimplemented height or footprint inputs',()=>{expect(compare(parcel,proposal,{...proposal,stories:5,heightFt:80,footprintSqFt:2200}).changes).toHaveLength(0);});
 it('withholds scores for a failed enabled physical source',()=>{const p=structuredClone(parcel);p.layers[0].available=false;const r=analyze(p,proposal);expect(r.score.value).toBeNull();expect(r.score.criticalUnknownIds).toContain('site.slope25');expect(r.score.assessedChecks).toBe(4);expect(compare(p,proposal,{...proposal,units:4}).scoreDifference).toBeNull();});
 it('withholds scores for split zoning and unsupported districts',()=>{for(const code of ['UI','R3-L']){const p=structuredClone(parcel);if(code==='UI')p.zoningDistricts[0].code=code;else p.zoningDistricts.push({...p.zoningDistricts[0],code:'R2-L',share:20});expect(analyze(p,proposal).score.value).toBeNull();}});
 it('does not assume renovation or addition rights',()=>{for(const scope of ['renovation','addition'] as const)expect(analyze(parcel,{...proposal,scope}).score.value).toBeNull();});
 it('requires verified city coverage',()=>expect(analyze({...parcel,cityVerified:false},proposal).score.value).toBeNull());
 it('links every deduction to source, measurement and next action',()=>{const r=analyze(parcel,{...proposal,units:4});for(const d of r.score.deductions){const f=r.findings.find(f=>f.id===d.findingId)!;expect(f.penalty).toBe(d.points);expect(f.measuredValue).toBeDefined();expect(f.nextStep).toBeTruthy();expect(f.sourceIds.every(id=>r.sources.some(s=>s.id===id))).toBe(true);}});
 it('deduplicates penalties for one underlying condition',()=>{const fs=analyze(parcel,proposal).findings;const hazards=fs.filter(f=>f.category==='physical').map(f=>({...f,status:'major' as const,conditionId:'same-condition'}));const r=scoreFindings([...fs.filter(f=>f.category!=='physical'),...hazards]);expect(r.value).toBe(85);expect(r.deductions).toHaveLength(1);});
 it('does not produce a perfect score from missing checks',()=>expect(scoreFindings([]).value).toBeNull());
 it('produces grounded explanations without any API key',()=>{const r=analyze(parcel,proposal);expect(explain(r).generatedBy).toBe('template');expect(explain(r).citedSourceIds.every(id=>r.sources.some(s=>s.id===id))).toBe(true);});
});
describe('input and spatial validation',()=>{
 it('rejects inconsistent building class, negative inputs and noninteger units',()=>{expect(ProposalSchema.safeParse({...proposal,buildingType:'detached'}).success).toBe(false);expect(ProposalSchema.safeParse({...proposal,footprintSqFt:-1}).success).toBe(false);expect(ProposalSchema.safeParse({...proposal,units:3.5}).success).toBe(false);});
 it('unions overlapping hazard geometry without double-counting',()=>{const hit=overlap(parcel.geometry,[parcel.geometry,parcel.geometry]);expect(hit.overlapPercent).toBeCloseTo(100);expect(hit.overlapSqFt).toBeCloseTo(parcel.areaSqFt);});
 it('rejects empty or invalid polygons',()=>{expect(()=>validGeometry({type:'Polygon',coordinates:[]})).toThrow();});
});
