import type {
  AttestationRequest,
  DocumentRevisionRequest,
  Health,
  Operation,
  Role,
  RouteSelectionRequest,
  ScenarioRequest,
  Shipment,
  ShipmentList,
} from './types';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createCaspianClient(baseUrl: string, getDemoRole: () => Role) {
  const base = baseUrl.replace(/\/$/, '');
  async function request<T>(path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer demo-${getDemoRole()}`,
        ...(body === undefined
          ? {}
          : {
              'Content-Type': 'application/json',
              'Idempotency-Key': idempotencyKey ?? crypto.randomUUID(),
            }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(response.status, data.error?.code ?? 'HTTP_ERROR', data.error?.message ?? 'Ошибка API');
    }
    return data as T;
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
    setScenario: (body: ScenarioRequest, key: string) => request<Shipment>('/demo/scenarios', body, key),
  };
}
