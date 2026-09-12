-- Enable PostGIS, trigram search, and cryptographic extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Jurisdictions (Municipalities, Counties, Caltrans districts)
CREATE TABLE IF NOT EXISTS jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    level VARCHAR(16) NOT NULL CHECK (level IN ('MUNICIPALITY', 'COUNTY', 'STATE')),
    state_code VARCHAR(2) NOT NULL DEFAULT 'CA',
    boundary GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jurisdictions_boundary ON jurisdictions USING GIST (boundary);

-- 2. Agencies & Civic Connectors
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website TEXT,
    reporting_method VARCHAR(32) NOT NULL DEFAULT 'MOCK' CHECK (reporting_method IN ('OPEN311', 'REST_API', 'EMAIL', 'MOCK')),
    connector_id VARCHAR(64) NOT NULL DEFAULT 'mock-connector',
    connector_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agencies_jurisdiction ON agencies (jurisdiction_id);

-- 3. Cases (Road hazards & civic infrastructure defects)
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id VARCHAR(16) UNIQUE NOT NULL, -- e.g. PA-001824
    reporter_id UUID,                      -- optional auth.users reference
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    category VARCHAR(32) NOT NULL DEFAULT 'POTHOLE',
    location GEOGRAPHY(Point, 4326) NOT NULL,
    address TEXT NOT NULL,
    community_status VARCHAR(32) NOT NULL DEFAULT 'NEW' 
        CHECK (community_status IN ('NEW', 'CONFIRMED', 'OPEN', 'FIXED_PENDING_VERIFICATION', 'RESOLVED', 'REOPENED')),
    official_status VARCHAR(32) NOT NULL DEFAULT 'NOT_SUBMITTED'
        CHECK (official_status IN ('NOT_SUBMITTED', 'SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'CLOSED', 'REJECTED', 'OVERDUE')),
    severity VARCHAR(16) NOT NULL DEFAULT 'SIGNIFICANT'
        CHECK (severity IN ('MINOR', 'SIGNIFICANT', 'DANGEROUS')),
    confirmation_count INT NOT NULL DEFAULT 1,
    follower_count INT NOT NULL DEFAULT 1,
    comment_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    submitted_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cases_location ON cases USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_cases_community_status ON cases (community_status);
CREATE INDEX IF NOT EXISTS idx_cases_official_status ON cases (official_status);
CREATE INDEX IF NOT EXISTS idx_cases_public_id ON cases (public_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases (created_at DESC);

-- 4. Case Media (Evidence photos)
CREATE TABLE IF NOT EXISTS case_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    blurhash VARCHAR(64),
    type VARCHAR(16) NOT NULL DEFAULT 'INITIAL' CHECK (type IN ('INITIAL', 'RESOLUTION', 'EVIDENCE')),
    captured_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_case_media_case ON case_media (case_id);

-- 5. Case Confirmations (Civic "I See This Too" validations)
CREATE TABLE IF NOT EXISTS case_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_identifier TEXT NOT NULL, -- user ID or client device hash
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    UNIQUE (case_id, user_identifier)
);

CREATE INDEX IF NOT EXISTS idx_case_confirmations_case ON case_confirmations (case_id);

-- 6. Case Events (Immutable audit trail timeline)
CREATE TABLE IF NOT EXISTS case_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL, -- 'REPORTED', 'CONFIRMED', 'SUBMITTED_TO_AGENCY', 'AGENCY_ACKNOWLEDGED', 'REPAIR_CLAIMED', 'COMMUNITY_VERIFIED'
    actor_type VARCHAR(16) NOT NULL CHECK (actor_type IN ('USER', 'AGENCY', 'SYSTEM')),
    actor_id TEXT,
    payload JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_case_events_case_timeline ON case_events (case_id, created_at ASC);

-- 7. Agency Submissions & External Tracking
CREATE TABLE IF NOT EXISTS agency_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    external_case_id VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    raw_response JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agency_submissions_case ON agency_submissions (case_id);

---

-- Stored Procedures: PostGIS Proximity & Routing

-- Proximity duplicate check: returns active cases within radius (default 25 meters)
CREATE OR REPLACE FUNCTION find_nearby_cases(
    target_lng DOUBLE PRECISION,
    target_lat DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 25.0
)
RETURNS TABLE (
    case_id UUID,
    public_id VARCHAR,
    title VARCHAR,
    address TEXT,
    community_status VARCHAR,
    official_status VARCHAR,
    confirmation_count INT,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.public_id,
        c.title,
        c.address,
        c.community_status,
        c.official_status,
        c.confirmation_count,
        ST_Distance(c.location, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography) AS distance_meters
    FROM cases c
    WHERE ST_DWithin(c.location, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography, radius_meters)
      AND c.community_status NOT IN ('RESOLVED')
    ORDER BY distance_meters ASC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;

-- Auto-resolve responsible agency for a given coordinate
CREATE OR REPLACE FUNCTION resolve_agency_for_point(
    target_lng DOUBLE PRECISION,
    target_lat DOUBLE PRECISION
)
RETURNS TABLE (agency_id UUID, jurisdiction_id UUID, agency_name TEXT, reporting_method VARCHAR) AS $$
    SELECT a.id, j.id, a.name, a.reporting_method
    FROM jurisdictions j
    JOIN agencies a ON a.jurisdiction_id = j.id
    WHERE ST_Contains(j.boundary, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326))
    ORDER BY CASE j.level WHEN 'MUNICIPALITY' THEN 1 WHEN 'COUNTY' THEN 2 ELSE 3 END ASC
    LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Atomic case confirmation RPC
CREATE OR REPLACE FUNCTION confirm_case(
    target_case_id UUID,
    user_ident TEXT
)
RETURNS JSONB AS $$
DECLARE
    already_confirmed BOOLEAN;
    new_count INT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM case_confirmations 
        WHERE case_id = target_case_id AND user_identifier = user_ident
    ) INTO already_confirmed;

    IF already_confirmed THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already confirmed');
    END IF;

    INSERT INTO case_confirmations (case_id, user_identifier)
    VALUES (target_case_id, user_ident);

    UPDATE cases
    SET confirmation_count = confirmation_count + 1,
        community_status = CASE WHEN community_status = 'NEW' THEN 'CONFIRMED' ELSE community_status END
    WHERE id = target_case_id
    RETURNING confirmation_count INTO new_count;

    INSERT INTO case_events (case_id, event_type, actor_type, actor_id, payload)
    VALUES (
        target_case_id, 
        'CONFIRMATION_ADDED', 
        'USER', 
        user_ident, 
        jsonb_build_object('new_count', new_count)
    );

    RETURN jsonb_build_object('success', true, 'confirmation_count', new_count);
END;
$$ LANGUAGE plpgsql VOLATILE;

---

-- Row-Level Security (RLS)
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cases are publicly viewable" ON cases FOR SELECT USING (true);
CREATE POLICY "Cases can be created publicly" ON cases FOR INSERT WITH CHECK (true);

CREATE POLICY "Media is publicly viewable" ON case_media FOR SELECT USING (true);
CREATE POLICY "Media can be inserted" ON case_media FOR INSERT WITH CHECK (true);

CREATE POLICY "Events are publicly viewable" ON case_events FOR SELECT USING (true);
CREATE POLICY "Confirmations are publicly viewable" ON case_confirmations FOR SELECT USING (true);
