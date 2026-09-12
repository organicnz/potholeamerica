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
  officialStatus: 'SUBMITTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'CLOSED' | 'REJECTED' | 'OVERDUE';
  statusNotes?: string;
  updatedAt: Date;
}

export interface CivicConnector {
  readonly connectorId: string;
  getServices(): Promise<ServiceCode[]>;
  submitCase(payload: CaseSubmissionPayload): Promise<SubmissionResponse>;
  pollStatus(externalCaseId: string): Promise<StatusUpdate | null>;
}
