# Implemented scope and limitations

ParcelPilot is a preliminary decision-support prototype, not an approval, survey, legal interpretation, geotechnical report, appraisal, or underwriting tool.

- Official county polygon lookup and exact polygon intersections with Pittsburgh base zoning, 25% slope, and landslide-prone maps are implemented.
- City coverage is inferred from >=99% overlap with the City's zoning polygons. It is not independently validated against a municipal boundary dataset. Outside mapped coverage returns 422; incomplete coverage produces an identity unknown.
- The base-use screen supports new construction in R1D, R1A, R2, R3 and RM, for one detached unit, two units, and three units. Four or more units in non-RM residential districts are apparent base-table conflicts. Four-plus units in RM are unknown because additional standards are not implemented. This checks only the residential base-use table, not overlays, accessory dwellings, site-specific approvals, lawful nonconformity, relief or development entitlement.
- Renovation and addition use findings remain unknown because existing lawful use is not an input. Lot-area findings always require verification; 2025 amendments and lot exceptions are not reduced to a guessed threshold.
- Height, stories and footprint area are stored inputs but do not change a scored check. Footprint placement is unknown. Setbacks, height, parking, lot coverage, nonconformity, overlays and review path are not assessed.
- Flood and undermined layers are not enabled and are omitted from the scoring denominator. No feature flag pretends to enable an unverified adapter.
- Hazard checks measure mapped parcel exposure. No mapped overlap does not mean no hazard. GIS precision and boundary discrepancies remain. Material overlap uses >1 sq ft and >0.1% of the parcel; smaller touches are not penalized.
- Scoring weights (5/15/25), bands and zoning-conflict cap of 49 are provisional design hypotheses, not empirically calibrated. A score of 100 is possible with unscored/unresolved requirements and must not be interpreted as buildability. Identity, base zoning, use and both enabled physical checks gate scoring. Lot area is counted as eligible but unknown and does not itself gate scoring, following the PRD's explicit gate.
- Shared A/B snapshots ensure matched data/rules. Scores are compared only with identical unknown-check coverage. Scenarios are hypothetical.
- No address search, footprint drawing, permit history, assessed value, owner information, account, database or financial model is implemented.
- Templates provide explanations; no LLM or API key is used at runtime.
- The first page shows a labeled dated public snapshot. Analyze/refresh attempts live data. Whole-parcel outages fall back only to a matching real snapshot; layer failures on a live parcel remain unknown. Cached successful parcel bundles expire after 24 hours and the in-process cache holds at most 100 parcels.
- Public ArcGIS metadata exposes no explicit dataset license in the inspected layer copyright fields. Public availability is not asserted to grant unrestricted redistribution. Confirm provider terms before wider distribution.
- OpenStreetMap's public raster tile service is suitable only within its usage policy, not a guaranteed production basemap SLA. Configure an appropriate public style URL for larger deployments. Attribution remains visible.
- No public deployment, repository publication, hackathon submission or video recording has been performed.
