---
name: civic-connector-engine
description: >-
  Standardized engineering patterns for routing public cases into government ticket systems.
  Use when implementing Open311 GeoReport v2, municipal REST connectors, automated email/PDF complaint dispatch, or civic mock sandboxes.
---

# Civic Connector Engine

## Architecture Overview
The platform connects citizen cases with governmental bodies without locking into a single vendor or standard. Every integration implements the unified `CivicConnector` interface.

```text
                           ┌────────────────────────┐
                           │   cases / submissions  │
                           └───────────┬────────────┘
                                       │
                                       ▼
                           ┌────────────────────────┐
                           │     CivicConnector     │
                           │       Interface        │
                           └───────────┬────────────┘
                                       │
       ┌───────────────────┬───────────┴───────────┬───────────────────┐
       ▼                   ▼                       ▼                   ▼
┌──────────────┐   ┌──────────────┐        ┌──────────────┐    ┌──────────────┐
│   Open311    │   │  Custom REST │        │  Email / PDF │    │ Mock Sandbox │
│ (GeoReport)  │   │ (CityWorks)  │        │ (Headless)   │    │  (Local Dev) │
└──────────────┘   └──────────────┘        └──────────────┘    └──────────────┘
```

---

## 1. Unified Connector Interface

```typescript
// src/lib/connectors/types.ts
export interface ServiceCode {
  service_code: string;
  service_name: string;
  description?: string;
  metadata: boolean;
  type: 'realtime' | 'batch' | 'blackbox';
  keywords?: string[];
}

export interface CaseSubmissionPayload {
  caseId: string;
  publicId: string;
  serviceCode: string;
  lat: number;
  lng: number;
  address: string;
  description: string;
  mediaUrls: string[];
  reporter: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface SubmissionResponse {
  success: boolean;
  externalCaseId: string;
  token?: string;
  rawResponse: Record<string, unknown>;
}

export interface StatusUpdate {
  externalCaseId: string;
  officialStatus: 'SUBMITTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'CLOSED' | 'REJECTED';
  statusNotes?: string;
  updatedAt: Date;
}

export interface CivicConnector {
  readonly connectorId: string;
  getServices(): Promise<ServiceCode[]>;
  submitCase(payload: CaseSubmissionPayload): Promise<SubmissionResponse>;
  pollStatus(externalCaseId: string): Promise<StatusUpdate | null>;
}
```

---

## 2. Open311 GeoReport v2 Implementation

```typescript
// src/lib/connectors/open311.ts
import type { CivicConnector, CaseSubmissionPayload, SubmissionResponse, StatusUpdate, ServiceCode } from './types';

export class Open311Connector implements CivicConnector {
  constructor(
    public readonly connectorId: string,
    private readonly endpointUrl: string,
    private readonly apiKey: string,
    private readonly jurisdictionId: string
  ) {}

  async getServices(): Promise<ServiceCode[]> {
    const url = new URL(`${this.endpointUrl}/services.json`);
    url.searchParams.set('jurisdiction_id', this.jurisdictionId);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Open311 error: ${res.statusText}`);
    return res.json();
  }

  async submitCase(payload: CaseSubmissionPayload): Promise<SubmissionResponse> {
    const form = new URLSearchParams();
    form.set('api_key', this.apiKey);
    form.set('jurisdiction_id', this.jurisdictionId);
    form.set('service_code', payload.serviceCode);
    form.set('lat', payload.lat.toString());
    form.set('long', payload.lng.toString());
    form.set('address_string', payload.address);
    form.set('description', `[Pothole America Case ${payload.publicId}] ${payload.description}`);
    if (payload.mediaUrls[0]) form.set('media_url', payload.mediaUrls[0]);

    const res = await fetch(`${this.endpointUrl}/requests.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    const [data] = await res.json();
    return {
      success: !!data.service_request_id,
      externalCaseId: data.service_request_id || data.token,
      token: data.token,
      rawResponse: data,
    };
  }

  async pollStatus(externalCaseId: string): Promise<StatusUpdate | null> {
    const url = `${this.endpointUrl}/requests/${externalCaseId}.json?jurisdiction_id=${this.jurisdictionId}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const [data] = await res.json();
    let officialStatus: StatusUpdate['officialStatus'] = 'SUBMITTED';

    switch (data.status?.toLowerCase()) {
      case 'open':
        officialStatus = 'IN_PROGRESS';
        break;
      case 'closed':
        officialStatus = 'CLOSED';
        break;
      default:
        officialStatus = 'ACKNOWLEDGED';
    }

    return {
      externalCaseId,
      officialStatus,
      statusNotes: data.status_notes,
      updatedAt: new Date(data.updated_datetime || data.requested_datetime),
    };
  }
}
```

---

## 3. Mock Civic Sandbox for Development & CI

Always use the `MockCivicConnector` when `NODE_ENV === 'development'` or during automated tests:

```typescript
// src/lib/connectors/mock.ts
export class MockCivicConnector implements CivicConnector {
  readonly connectorId = 'mock-connector';

  async getServices(): Promise<ServiceCode[]> {
    return [
      { service_code: 'POTHOLE', service_name: 'Pothole or Road Defect', metadata: false, type: 'realtime' },
    ];
  }

  async submitCase(payload: CaseSubmissionPayload): Promise<SubmissionResponse> {
    return {
      success: true,
      externalCaseId: `MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
      rawResponse: { simulated: true, receivedAt: new Date().toISOString() },
    };
  }

  async pollStatus(externalCaseId: string): Promise<StatusUpdate | null> {
    return {
      externalCaseId,
      officialStatus: 'IN_PROGRESS',
      statusNotes: 'Simulated city crew scheduled for inspection.',
      updatedAt: new Date(),
    };
  }
}
```
