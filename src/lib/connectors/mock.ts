import type {
  CaseSubmissionPayload,
  CivicConnector,
  ServiceCode,
  StatusUpdate,
  SubmissionResponse,
} from './types';

export class MockCivicConnector implements CivicConnector {
  readonly connectorId = 'mock-connector';

  async getServices(): Promise<ServiceCode[]> {
    return [
      {
        service_code: 'POTHOLE',
        service_name: 'Pothole or Road Defect',
        metadata: false,
        type: 'realtime',
      },
      {
        service_code: 'STREETLIGHT',
        service_name: 'Streetlight Outage',
        metadata: false,
        type: 'realtime',
      },
    ];
  }

  async submitCase(payload: CaseSubmissionPayload): Promise<SubmissionResponse> {
    const externalCaseId = `311-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      success: true,
      externalCaseId,
      rawResponse: {
        agency: 'Sacramento Department of Public Works',
        status: 'RECEIVED',
        caseId: payload.caseId,
        receivedAt: new Date().toISOString(),
      },
    };
  }

  async pollStatus(externalCaseId: string): Promise<StatusUpdate | null> {
    return {
      externalCaseId,
      officialStatus: 'IN_PROGRESS',
      statusNotes: 'Field crew assigned to inspect roadway section.',
      updatedAt: new Date(),
    };
  }
}
