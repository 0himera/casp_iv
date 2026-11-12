import type {
  Attest, CreateDemoShipment, Operation, ReplaceDocument, RevisionInput,
  SelectRoute, Shipment, ShipmentList, PredictionRequest, ShipmentComparison,
  UpdateForecast, EmissionsRequest, EmissionsComparison, AddRouteCandidate,
  RecalculateRequest,
} from './public-data.types';

export class TransitError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'TransitError';
  }
}

/** Use funded role tokens in a trusted Next.js server route; keep them out of browser bundles. */
export function createTransitClient(baseUrl = 'http://localhost:8000/api/v1', token?: string) {
  const base = baseUrl.replace(/\/$/, '');
  async function request<T>(path: string, body?: unknown, key?: string, signal?: AbortSignal) {
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST', cache: 'no-store', signal,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(key ? { 'Idempotency-Key': key } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const value = await response.json();
    if (!response.ok) throw new TransitError(response.status, value.error?.code ?? 'HTTP_ERROR',
      value.error?.message ?? 'Ошибка API');
    return value as T;
  }
  const shipment = (id: string) => `/shipments/${encodeURIComponent(id)}`;
  return {
    shipments: (signal?: AbortSignal) => request<ShipmentList>('/shipments', undefined, undefined, signal),
    shipment: (id: string, signal?: AbortSignal) =>
      request<Shipment>(shipment(id), undefined, undefined, signal),
    compareRoutes: (id: string, body: PredictionRequest, signal?: AbortSignal) =>
      request<ShipmentComparison>(`${shipment(id)}/route-comparison`, body, undefined, signal),
    updateForecast: (id: string, body: UpdateForecast, key: string) =>
      request<Shipment>(`${shipment(id)}/forecast`, body, key),
    recalculate: (id: string, body: RecalculateRequest, key: string) =>
      request<Shipment>(`${shipment(id)}/recalculate`, body, key),
    addRouteCandidate: (id: string, body: AddRouteCandidate, key: string) =>
      request<Shipment>(`${shipment(id)}/route-candidates`, body, key),
    compareEmissions: (id: string, body: EmissionsRequest, signal?: AbortSignal) =>
      request<EmissionsComparison>(`${shipment(id)}/emissions-comparison`, body, undefined, signal),
    operation: (id: string, signal?: AbortSignal) =>
      request<Operation>(`/operations/${encodeURIComponent(id)}`, undefined, undefined, signal),
    create: (body: CreateDemoShipment, key: string) => request<Operation>('/shipments', body, key),
    selectRoute: (id: string, body: SelectRoute, key: string) =>
      request<Operation>(`${shipment(id)}/route-selection`, body, key),
    replaceDocument: (id: string, body: ReplaceDocument, key: string) =>
      request<Operation>(`${shipment(id)}/document-revisions`, body, key),
    attest: (id: string, body: Attest, key: string) =>
      request<Operation>(`${shipment(id)}/attestations`, body, key),
    revoke: (id: string, body: RevisionInput, key: string) =>
      request<Operation>(`${shipment(id)}/revocations`, body, key),
  };
}
