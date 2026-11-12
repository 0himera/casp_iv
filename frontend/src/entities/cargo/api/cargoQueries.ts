import { useQuery } from '@tanstack/react-query';
import {
  BASE_FORECAST,
  CASPIAN_PORTS,
  INITIAL_CARGOS,
  STORM_FORECAST,
} from '@/data/mockTransitData';

export const cargoKeys = {
  all: ['transit'] as const,
  cargos: () => [...cargoKeys.all, 'cargos'] as const,
  ports: () => [...cargoKeys.all, 'ports'] as const,
  forecast: (stormActive: boolean) =>
    [...cargoKeys.all, 'forecast', stormActive] as const,
};

export function useTransitCargosQuery() {
  return useQuery({
    queryKey: cargoKeys.cargos(),
    queryFn: async () => INITIAL_CARGOS,
    initialData: INITIAL_CARGOS,
  });
}

export function useCaspianPortsQuery() {
  return useQuery({
    queryKey: cargoKeys.ports(),
    queryFn: async () => CASPIAN_PORTS,
    initialData: CASPIAN_PORTS,
  });
}

export function useForecastQuery(stormActive: boolean) {
  return useQuery({
    queryKey: cargoKeys.forecast(stormActive),
    queryFn: async () => (stormActive ? STORM_FORECAST : BASE_FORECAST),
    initialData: stormActive ? STORM_FORECAST : BASE_FORECAST,
  });
}

