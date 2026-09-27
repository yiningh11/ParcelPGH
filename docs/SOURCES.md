# Source registry

Live services and schemas were inspected on September 26, 2026. Each normalized source record preserves its actual query URL and retrieval timestamp. `fixtures/public-snapshots/parcels.json` contains actual public responses normalized by the same adapters used at runtime; no owner fields are requested or stored.

| Source | Exact layer endpoint | Fields requested | Source CRS |
|---|---|---|---|
| Allegheny County Parcels | https://gisdata.alleghenycounty.us/arcgis/rest/services/OPENDATA/Parcels/MapServer/0 | PIN, MAPBLOCKLOT, MUNICODE, CALCACREAGE, SHAPE_Area | EPSG:2272 / ESRI:102729; US survey feet |
| Pittsburgh base zoning | https://pghbridgis.pittsburghpa.gov/federated/rest/services/Zoning/FeatureServer/0 | zon_new, full_zoning_type | EPSG:2272 / ESRI:102729 |
| Pittsburgh Slope 25 | https://pghbridgis.pittsburghpa.gov/federated/rest/services/Slope_25/MapServer/0 | slope25 | See live layer metadata; output requested as EPSG:4326 |
| Pittsburgh Landslide Prone | https://pghbridgis.pittsburghpa.gov/federated/rest/services/Landslide_Prone/MapServer/0 | landslideprone, code | See live layer metadata; output requested as EPSG:4326 |
| Pittsburgh Code, §§911.01–911.02 | https://ecode360.com/45476538 | Curated base-use classifications, interpretation of P and blank entries | N/A |
| Pittsburgh Code, §903.03 | https://ecode360.com/45474194 | Context citation only; no minimum-area thresholds encoded | N/A |
| Basemap | https://tile.openstreetmap.org/{z}/{x}/{y}.png | Public raster tiles, not screening evidence | Web Mercator |

## Queries and normalization

ArcGIS `/query` requests use `f=geojson`, `outSR=4326`, restricted `outFields` and `returnGeometry=true`. Parcel identity queries use an alphanumeric validated PIN or MAPBLOCKLOT. Simple hyphenated block-letter-lot aliases are zero-padded to the standard PIN; suffixed/complex identifiers should use the full official PIN. Provider URLs are fixed in server code, never supplied by a client.

Spatial queries use the parcel envelope as a superset, then Turf polygon intersection clips actual returned polygons to the full parcel. There are no centroid-only overlap decisions. Intersections are unioned to avoid double-counting; Turf geodesic area is converted from square meters to square feet. The county's `SHAPE_Area` is also preserved as reported area, separately from measured area. CRS output, polygon validity, HTTP failures, ArcGIS error payloads and transfer-limit flags are checked. Truncated or invalid layers become unknown; no partial layer is considered clear. A >1 sq ft and >0.1% parcel-area tolerance excludes tiny boundary touches. Zoning districts are grouped by `zon_new`; material multiple districts trigger unknown base/use interpretation.

## Freshness and fallback

Each fetch times out after 8 seconds. Independent zoning/slope/landslide calls run together. The server caches up to 100 parcel bundles for 24 hours. Cached responses retain original timestamps and are labeled cached. Refresh bypasses the in-process cache. A failed parcel lookup uses a checked-in snapshot only for an exact matching PIN; otherwise it returns 503. A successful lookup with a failed overlay returns a partial result and unknown finding. The initial screen intentionally uses the dated sample and labels it as a snapshot. An unavailable source retains that status even inside a snapshot bundle.

The retrieval timestamp is not a survey date or dataset effective date. GIS metadata did not establish authoritative ground-condition update dates. The use-table rule was checked against the codified text on September 26, 2026 and is versioned `PGH-BASE-USE-2026-09-26`; it is not a comprehensive legal review. §911.01.B conditions permitted uses on all other applicable regulations, and §911.01.F preserves expressly permitted alternatives. Those limitations are displayed with the base-table result. §911.04A.69 was inspected as the single-unit cross-reference; accessory structure and corner-lot dimensional compliance are not evaluated. Four-plus-unit RM is withheld pending use standards/site-plan review. Renovation/addition rights are unsupported.

## Licensing and attribution

Inspected ArcGIS copyright fields are blank; no unrestricted license is asserted. Confirm County/City reuse terms before redistribution or public launch. The application identifies and links the providers. The basemap displays OpenStreetMap attribution and links to https://www.openstreetmap.org/copyright. Follow https://operations.osmfoundation.org/policies/tiles/; no prefetching or offline tile downloads are implemented. MapLibre's packaged worker files retain their BSD license header and are copied at predev/prebuild.

FEMA, undermined areas and permits are not integrated. They do not contribute evidence or penalties.
