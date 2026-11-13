import type {
  AttestationRequest,
  ChangeJourney,
  JourneyPreview,
  DocumentRevisionRequest,
  Health,
  PassportStateResponse,
  PassportVersionResponse,
  Operation,
  Role,
  RouteSelectionRequest,
  Shipment,
  ShipmentList,
  RecalculateRequest,
} from './types';
import { getRoleToken } from './tokens';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createCaspianClient(baseUrl: string, getDemoRole: () => Role) {
  const base = baseUrl.replace(/\/$/, '');
  async function request<T>(path: string, body?: unknown, idempotencyKey?: string, asBlob = false): Promise<T> {
    const role = getDemoRole();
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout((path.endsWith('/recalculate') || path.endsWith('/passport-state') || path.endsWith('/journey')) ? 45000 : 15000),
      headers: {
        Authorization: `Bearer ${getRoleToken(role)}`,
        ...(body === undefined
          ? {}
          : {
              'Content-Type': 'application/json',
              'Idempotency-Key': idempotencyKey ?? crypto.randomUUID(),
            }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new ApiError(response.status, data.error?.code ?? 'HTTP_ERROR', data.error?.message ?? 'Ошибка API');
    }
    return (asBlob ? await response.blob() : await response.json()) as T;
  }
  const shipmentPath = (id: string) => `/shipments/${encodeURIComponent(id)}`;
  return {
    health: () => request<Health>('/health'),
    listShipments: () => request<ShipmentList>('/shipments'),
    getShipment: (id: string) => request<Shipment>(shipmentPath(id)),
    getOperation: (id: string) => request<Operation>(`/operations/${encodeURIComponent(id)}`),
    selectRoute: (id: string, body: RouteSelectionRequest, key: string) =>
      request<Operation>(`${shipmentPath(id)}/route-selection`, body, key),
    replaceDocument: (id: string, body: DocumentRevisionRequest, key: string) =>
      request<Operation>(`${shipmentPath(id)}/document-revisions`, body, key),
    attest: (id: string, body: AttestationRequest, key: string) =>
      request<Operation>(`${shipmentPath(id)}/attestations`, body, key),
    revoke: (id: string, expectedRevision: number, key: string) =>
      request<Operation>(`${shipmentPath(id)}/revocations`, { expected_revision: expectedRevision }, key),
    getPassportState: (id: string) => request<PassportStateResponse>(`${shipmentPath(id)}/passport-state`),
    getPassportVersion: (id: string, version: number) => request<PassportVersionResponse>(`${shipmentPath(id)}/versions/${version}`),
    downloadDocument: (id: string, documentId: string, version: number) =>
      request<Blob>(`${shipmentPath(id)}/documents/${encodeURIComponent(documentId)}/versions/${version}`, undefined, undefined, true),
    previewJourney: (origin: string, destination: string) => request<JourneyPreview>(`/marine-route?${new URLSearchParams({ origin_port_id: origin, destination_port_id: destination })}`),
    changeJourney: (id: string, body: ChangeJourney, key: string) => request<Operation>(`${shipmentPath(id)}/journey`, body, key),
    recalculate: (id: string, body: RecalculateRequest, key: string) =>
      request<Shipment>(`${shipmentPath(id)}/recalculate`, body, key),
  };
}
