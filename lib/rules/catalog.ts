export const RULESET_VERSION='PGH-BASE-USE-2026-09-26';
export const CODE_SOURCE={id:'code.use',title:'Pittsburgh Code §911.01–911.02 · Residential base-use table',url:'https://ecode360.com/45476538',retrievedAt:'2026-09-26T21:30:00.000Z',mode:'reference' as const};
// Narrow base-table screen, not entitlement or overlay clearance. Renovations and additions
// remain unknown because existing lawful use / nonconforming rights are not supplied.
export const USE_DISTRICTS=['R1D','R1A','R2','R3','RM'];
export function baseUseAllowed(district:string,units:number){return units===1||units===2&&['R2','R3','RM'].includes(district)||units===3&&['R3','RM'].includes(district)||units>=4&&district==='RM';}
