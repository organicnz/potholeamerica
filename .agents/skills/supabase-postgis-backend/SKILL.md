---
name: supabase-postgis-backend
description: >-
  Rules, schema design, PostGIS spatial queries, and Row-Level Security (RLS) for the Supabase backend.
  Use when writing SQL migrations, database functions, spatial proximity queries, RLS policies, or generating TypeScript database types.
---

# Supabase & PostGIS Backend Architecture

## Core Principles
1. **Never use raw lat/long floats**: Store spatial coordinates using PostGIS `geography(Point, 4326)`.
2. **Spatial Indexing**: Every spatial column (`location`, `boundary`) **must** have a `GIST` index.
3. **RLS on Every Table**: Enable Row-Level Security from migration #1. Public can read cases; state mutations must occur through controlled RPC functions.
4. **Dual Status Architecture**: Decouple `community_status` from `official_status`.

---

## Migration Workflow
Generate migrations using the Supabase CLI:
```bash
bunx supabase migration new <migration_name>
```

Sync generated TypeScript types into the frontend:
```bash
bunx supabase gen types typescript --local > src/types/database.types.ts
```

---

## Core PostGIS Schema Pattern

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Jurisdictions (Municipalities, Counties, Caltrans districts)
CREATE TABLE jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    type VARCHAR(32) NOT NULL, -- 'CITY', 'COUNTY', 'STATE'
    boundary GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

CREATE INDEX idx_jurisdictions_boundary ON jurisdictions USING GIST (boundary);

-- 2. Cases
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id VARCHAR(16) UNIQUE NOT NULL, -- e.g. PA-001824
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE SET NULL,
    title VARCHAR(120),
    description TEXT,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    address TEXT NOT NULL,
    community_status VARCHAR(32) DEFAULT 'NEW' NOT NULL,
    official_status VARCHAR(32) DEFAULT 'NOT_SUBMITTED' NOT NULL,
    severity VARCHAR(16) DEFAULT 'SIGNIFICANT' NOT NULL, -- 'MINOR', 'SIGNIFICANT', 'DANGEROUS'
    confirmation_count INT DEFAULT 1 NOT NULL,
    follower_count INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    submitted_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_cases_location ON cases USING GIST (location);
CREATE INDEX idx_cases_community_status ON cases (community_status);
CREATE INDEX idx_cases_public_id ON cases (public_id);
```

---

## PostGIS Geospatial Queries

### 1. Duplicate Detection (Reporting Step 3)
Find unresolved defects within 25 meters:
```sql
CREATE OR REPLACE FUNCTION find_nearby_cases(
    target_lng DOUBLE PRECISION,
    target_lat DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 25.0
)
RETURNS TABLE (
    case_id UUID,
    public_id VARCHAR,
    address TEXT,
    confirmation_count INT,
    community_status VARCHAR,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.public_id,
        c.address,
        c.confirmation_count,
        c.community_status,
        ST_Distance(c.location, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography) AS distance_meters
    FROM cases c
    WHERE ST_DWithin(c.location, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography, radius_meters)
      AND c.community_status NOT IN ('RESOLVED')
    ORDER BY distance_meters ASC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### 2. Auto-Resolving Jurisdiction
```sql
CREATE OR REPLACE FUNCTION resolve_jurisdiction_for_point(
    target_lng DOUBLE PRECISION,
    target_lat DOUBLE PRECISION
)
RETURNS UUID AS $$
    SELECT j.id
    FROM jurisdictions j
    WHERE ST_Contains(j.boundary, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326))
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## Row-Level Security (RLS) Template
```sql
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Anyone can view public cases
CREATE POLICY "Public cases are viewable by everyone" 
ON cases FOR SELECT 
USING (true);

-- Authenticated users can submit a case
CREATE POLICY "Users can insert their own cases" 
ON cases FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = reporter_id);

-- Only service role / RPC can update counts and statuses
CREATE POLICY "Users cannot directly update cases" 
ON cases FOR UPDATE 
TO authenticated 
USING (false);
```

---

## Atomic RPC Actions
```sql
-- Atomic case confirmation with confirmation log and counter increment
CREATE OR REPLACE FUNCTION confirm_case(target_case_id UUID)
RETURNS JSONB AS $$
DECLARE
    current_user_id UUID := auth.uid();
    already_confirmed BOOLEAN;
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM case_confirmations 
        WHERE case_id = target_case_id AND user_id = current_user_id
    ) INTO already_confirmed;

    IF already_confirmed THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already confirmed');
    END IF;

    INSERT INTO case_confirmations (case_id, user_id)
    VALUES (target_case_id, current_user_id);

    UPDATE cases
    SET confirmation_count = confirmation_count + 1,
        community_status = CASE WHEN community_status = 'NEW' THEN 'CONFIRMED' ELSE community_status END
    WHERE id = target_case_id;

    INSERT INTO case_events (case_id, event_type, actor_type, actor_id, payload)
    VALUES (target_case_id, 'CONFIRMATION_ADDED', 'USER', current_user_id, '{}'::jsonb);

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
```
