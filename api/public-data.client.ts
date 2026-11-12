import type { ActivityResponse, Health, Port, PortList, WeatherResponse } from './public-data.types';

export class PublicDataError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'PublicDataError';
  }
}

/** Public read-only API: no wallet, bearer token or provider key required. */
export function createPublicDataClient(baseUrl = 'http://localhost:8000/api/v1') {
  const base = baseUrl.replace(/\/$/, '');
  async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(base + path, { cache: 'no-store', signal });
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
  };
}
