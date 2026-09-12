---
name: civic-jurisdiction-importer
description: >-
  Ingesting municipal, county, and state boundary datasets into PostGIS MultiPolygons and configuring automated agency routing.
  Use when importing GeoJSON/Shapefiles, setting up new cities, or configuring boundary-based routing rules.
---

# Civic Jurisdiction Importer

## Overview
Pothole America routes cases based on physical geography rather than user guessing. This skill covers ingesting official municipal boundary polygons (US Census TIGER/Line, open data portals) into PostGIS `jurisdictions` and attaching `agencies`.

---

## 1. PostGIS Boundary Schema

```sql
CREATE TABLE jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,      -- e.g. 'sacramento-city'
    name TEXT NOT NULL,                     -- 'City of Sacramento'
    level VARCHAR(16) NOT NULL,             -- 'MUNICIPALITY', 'COUNTY', 'STATE'
    state_code VARCHAR(2) NOT NULL,         -- 'CA'
    boundary GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

CREATE INDEX idx_jurisdictions_geom ON jurisdictions USING GIST (boundary);
```

---

## 2. Ingestion Script Pattern (Bun CLI)

```typescript
// scripts/import-jurisdiction.ts
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

interface GeoJSONFeature {
  properties: {
    NAME: string;
    STATEFP: string;
    GEOID: string;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
}

async function importGeoJSON(filePath: string, level: 'MUNICIPALITY' | 'COUNTY' | 'STATE') {
  const content = await readFile(filePath, 'utf-8');
  const geojson = JSON.parse(content);

  for (const feature of geojson.features as GeoJSONFeature[]) {
    const name = feature.properties.NAME;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const geomJson = JSON.stringify(feature.geometry);

    console.log(`Ingesting ${name} (${slug})...`);

    await sql`
      INSERT INTO jurisdictions (slug, name, level, state_code, boundary)
      VALUES (
        ${slug},
        ${name},
        ${level},
        'CA',
        ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))
      )
      ON CONFLICT (slug) DO UPDATE
      SET boundary = EXCLUDED.boundary,
          name = EXCLUDED.name;
    `;
  }

  console.log('Ingestion complete. Repairing any self-intersecting polygons...');
  await sql`UPDATE jurisdictions SET boundary = ST_Multi(ST_MakeValid(boundary)) WHERE NOT ST_IsValid(boundary);`;
  await sql.end();
}

// Run: bun run scripts/import-jurisdiction.ts ./data/sacramento-boundaries.geojson MUNICIPALITY
const [file, level] = process.argv.slice(2);
if (file && level) {
  importGeoJSON(file, level as any);
}
```

---

## 3. Agency Routing Table Pattern

Attach responsible public works departments:

```sql
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                         -- 'Sacramento Department of Public Works'
    reporting_method VARCHAR(32) NOT NULL,      -- 'OPEN311', 'REST_API', 'EMAIL'
    connector_id VARCHAR(64) NOT NULL,          -- Matches CivicConnector.connectorId
    connector_config JSONB DEFAULT '{}'::jsonb, -- Endpoint URLs, service codes
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

-- Fast lookup of responsible agency for a reported point
CREATE OR REPLACE FUNCTION find_agency_for_point(lng DOUBLE PRECISION, lat DOUBLE PRECISION)
RETURNS TABLE (agency_id UUID, agency_name TEXT, reporting_method VARCHAR, connector_id VARCHAR) AS $$
    SELECT a.id, a.name, a.reporting_method, a.connector_id
    FROM jurisdictions j
    JOIN agencies a ON a.jurisdiction_id = j.id
    WHERE ST_Contains(j.boundary, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
    ORDER BY CASE j.level WHEN 'MUNICIPALITY' THEN 1 WHEN 'COUNTY' THEN 2 ELSE 3 END ASC
    LIMIT 1;
$$ LANGUAGE sql STABLE;
```
