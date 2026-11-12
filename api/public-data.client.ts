import type { ActivityResponse, Health, Port, PortList, WeatherResponse, SailingsResponse, PredictionRequest, PredictionResponse, DwellRequest, DwellResponse, DwellModelStatus } from './public-data.types';

export class PublicDataError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'PublicDataError';
  }
}

/** Public read-only API: no wallet, bearer token or provider key required. */
export function createPublicDataClient(baseUrl = 'http://localhost:8000/api/v1') {
  const base = baseUrl.replace(/\/$/, '');
  async function get<T>(path: string, signal?: AbortSignal, body?: unknown): Promise<T> {
    const response = await fetch(base + path, { cache: 'no-store', signal,
      ...(body === undefined ? {} : {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)}),
    });
    const value = await response.json();
    if (!response.ok) throw new PublicDataError(
      response.status, value.error?.code ?? 'HTTP_ERROR', value.error?.message ?? 'Ошибка источника',
    );
    return value as T;
  }
  const portPath = (id: string) => `/ports/${encodeURIComponent(id)}`;
  return {
    health: (signal?: AbortSignal) => get<Health>('/health', signal),
    ports: (signal?: AbortSignal) => get<PortList>('/ports', signal),
    port: (id: string, signal?: AbortSignal) => get<Port>(portPath(id), signal),
    weather: (id: string, forecastDays = 3, signal?: AbortSignal) =>
      get<WeatherResponse>(`${portPath(id)}/weather?forecast_days=${forecastDays}`, signal),
    activity: (id: string, days = 30, signal?: AbortSignal) =>
      get<ActivityResponse>(`${portPath(id)}/activity?days=${days}`, signal),
    sailings: (portId: string, signal?: AbortSignal) =>
      get<SailingsResponse>(`/sailings?port_id=${encodeURIComponent(portId)}`, signal),
    predictReadiness: (body: PredictionRequest, signal?: AbortSignal) =>
      get<PredictionResponse>('/predictions/readiness', signal, body),
    predictTerminalDwell: (body: DwellRequest, signal?: AbortSignal) =>
      get<DwellResponse>('/predictions/terminal-dwell', signal, body),
    terminalDwellModel: (signal?: AbortSignal) =>
      get<DwellModelStatus>('/models/terminal-dwell', signal),
  };
}
