export type CommunityStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'OPEN'
  | 'FIXED_PENDING_VERIFICATION'
  | 'RESOLVED'
  | 'REOPENED';

export type OfficialStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'CLOSED'
  | 'REJECTED'
  | 'OVERDUE';

export type Severity = 'MINOR' | 'SIGNIFICANT' | 'DANGEROUS';

export interface CaseRecord {
  id: string;
  public_id: string;
  reporter_id: string | null;
  jurisdiction_id: string | null;
  agency_id: string | null;
  title: string;
  description: string | null;
  category: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  community_status: CommunityStatus;
  official_status: OfficialStatus;
  severity: Severity;
  confirmation_count: number;
  follower_count: number;
  comment_count: number;
  photo_url?: string | null;
  created_at: string;
  submitted_at: string | null;
  resolved_at: string | null;
}

export interface CaseMediaRecord {
  id: string;
  case_id: string;
  storage_path: string;
  blurhash: string | null;
  type: 'INITIAL' | 'RESOLUTION' | 'EVIDENCE';
  captured_at: string;
  created_at: string;
}

export interface CaseEventRecord {
  id: string;
  case_id: string;
  event_type: string;
  actor_type: 'USER' | 'AGENCY' | 'SYSTEM';
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface JurisdictionRecord {
  id: string;
  slug: string;
  name: string;
  level: 'MUNICIPALITY' | 'COUNTY' | 'STATE';
  state_code: string;
  created_at: string;
}

export interface AgencyRecord {
  id: string;
  jurisdiction_id: string;
  name: string;
  website: string | null;
  reporting_method: 'OPEN311' | 'REST_API' | 'EMAIL' | 'MOCK';
  connector_id: string;
  created_at: string;
}
