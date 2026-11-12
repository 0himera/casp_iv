import { useQuery } from '@tanstack/react-query';
import { BASE_FORECAST, CASPIAN_PORTS, INITIAL_CARGOS, STORM_FORECAST } from '@/data/mockTransitData';
import type { CaspianPort } from '../model/types';
import { useLiveOverview } from './liveOverview';

export const cargoKeys = {
  all: ['transit'] as const,
  cargos: () => [...cargoKeys.all, 'cargos'] as const,
  ports: () => [...cargoKeys.all, 'ports'] as const,
  forecast: (stormActive: boolean) => [...cargoKeys.all, 'forecast', stormActive] as const,
};

export function useTransitCargosQuery() {
  return useQuery({ queryKey: cargoKeys.cargos(), queryFn: async () => INITIAL_CARGOS, initialData: INITIAL_CARGOS });
}

const countries: Record<string, string> = { RUS: 'РФ', KAZ: 'Казахстан', AZE: 'Азербайджан', TKM: 'Туркменистан', IRN: 'Иран' };

export function useCaspianPortsQuery() {
  const query = useLiveOverview();
  const ports: CaspianPort[] = (query.data?.items ?? []).flatMap((item) => {
    const position = item.port.coordinates;
    if (!position) return [];
    const existing = CASPIAN_PORTS.find((p) => p.id === item.port.id);
    const fallback = existing ?? CASPIAN_PORTS[0];
    const now = Date.parse(query.data?.generated_at ?? "1970-01-01T00:00:00Z");
    const point = item.weather?.hourly.find((p) => Date.parse(p.time) >= now) ?? null;
    const lastDate = item.activity?.latest_available_date;
    const day = item.activity?.daily.find((p) => p.date === lastDate) ?? null;
    return [{
      ...fallback, id: item.port.id, name: item.port.name,
      country: countries[item.port.country_iso3] ?? item.port.country_iso3,
      lat: position.latitude, lng: position.longitude,
      archiveIndex: '[ ОТКРЫТЫЕ ИСТОЧНИКИ ]',
      live: {
        demoMetricsAvailable: !!existing,
        windSpeed: point?.wind_speed_10m ?? null,
        windGusts: point?.wind_gusts_10m ?? null,
        weatherAt: point?.time ?? null,
        weatherStale: item.weather?.meta.stale ?? true,
        weatherSource: item.weather?.meta.source_url ?? null,
        portCalls: day?.portcalls ?? null,
        activityDate: lastDate ?? null,
        activityStale: item.activity?.meta.stale ?? true,
        activitySource: item.activity?.meta.source_url ?? null,
        sailings: item.sailings?.items.map((s) => ({ name: s.vessel_name, status: s.status_raw, category: s.category })) ?? [],
        sailingSources: item.sailings?.sources.map((s) => ({ url: s.source_url, date: s.reported_date, stale: s.stale })) ?? [],
        sailingAvailable: !!item.sailings,
      },
    }];
  });
  return { ...query, data: query.data ? ports : CASPIAN_PORTS };
}

export function useForecastQuery(stormActive: boolean) {
  return useQuery({ queryKey: cargoKeys.forecast(stormActive), queryFn: async () => stormActive ? STORM_FORECAST : BASE_FORECAST, initialData: stormActive ? STORM_FORECAST : BASE_FORECAST });
}
