# ParcelPilot

A working Next.js prototype for source-linked housing proposal screening on one Pittsburgh parcel, with A/B comparison.

## Run

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. No API key is required. Optional public basemap configuration is in `.env.example`.

## Implemented

- Official county parcel polygons; full-PIN or map-block-lot lookup; city coverage check from mapped City zoning.
- Exact polygon intersection and geodesic area for zoning, 25% slope and landslide-prone areas.
- Dated, real public-data snapshots, bounded cache, live refresh, explicit unavailable sources.
- Validated proposal forms; a narrow, cited residential base-use screen; transparent SCORING_V1 deductions and coverage gate.
- Two scenarios evaluated against one immutable source snapshot, exact changed/unchanged findings, evidence drawers and template explanations.
- Responsive map/report interface, layer controls, keyboard focus and native modal evidence dialog.

## API

- `GET /api/parcels/:pin`: normalized parcel, sources and warnings.
- `POST /api/analyze`: `{pin, proposal, ruleset:"current", refresh?:boolean}`.
- `POST /api/compare`: `{pin, scenarioA, scenarioB, ruleset:"current"}`.
- `POST /api/explain`: `{pin, proposal}`; recomputes authoritative findings and returns a deterministic explanation.

A proposal contains `scope`, `buildingType`, `units`, `stories`, optional `heightFt` and `footprintSqFt`. See `lib/schemas.ts` for bounds and enums. Owner details are neither requested nor returned.

## Validation

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Tests use real public snapshot geometry. Split zoning, unsupported districts and failures are explicitly simulated mutations for engine testing, not claims about those parcels. `scripts/capture-samples.ts` can refresh public snapshots with full official PIN arguments.

## Sources and limits

See [docs/SOURCES.md](docs/SOURCES.md) for endpoints, fields, provenance, spatial references and cache behavior, and [docs/LIMITATIONS.md](docs/LIMITATIONS.md) for exact supported cases and excluded checks. Read those before interpreting any score. Lot area is unresolved, flood/mine checks are disabled, and this is not a legal buildability determination.

## Tools and disclosure

Next.js, React, TypeScript, pnpm, Tailwind CSS, MapLibre GL JS, Turf.js, Zod, Lucide icons, ESLint and Vitest. OpenStreetMap provides attributed raster basemap tiles. AI-assisted implementation: OpenAI Codex. Runtime findings and explanations are deterministic; no runtime model makes zoning decisions.

Local prototype only. No public repository URL, deployment URL, recorded demo or hackathon compliance certification is claimed.
