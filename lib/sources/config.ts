export const SOURCES={
 parcel:{title:'Allegheny County · Parcel boundaries',url:'https://gisdata.alleghenycounty.us/arcgis/rest/services/OPENDATA/Parcels/MapServer/0',fields:'PIN,MAPBLOCKLOT,MUNICODE,CALCACREAGE,SHAPE_Area'},
 zoning:{title:'City of Pittsburgh · Base zoning',url:'https://pghbridgis.pittsburghpa.gov/federated/rest/services/Zoning/FeatureServer/0',fields:'zon_new,full_zoning_type'},
 slope:{title:'City of Pittsburgh · 25%+ slope',url:'https://pghbridgis.pittsburghpa.gov/federated/rest/services/Slope_25/MapServer/0',fields:'slope25'},
 landslide:{title:'City of Pittsburgh · Landslide-prone areas',url:'https://pghbridgis.pittsburghpa.gov/federated/rest/services/Landslide_Prone/MapServer/0',fields:'landslideprone,code'},
};
export type SourceKey=keyof typeof SOURCES;
