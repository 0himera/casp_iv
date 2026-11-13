import { useQuery } from '@tanstack/react-query';
import { SEED_SHIPMENT } from '@/data/caspianSnapshots';
import { createCaspianClient, type Role, type Shipment, type ShipmentSummary } from '@/shared/api/caspian';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/backend';

export const shipmentKeys = {
  all: ['caspian-shipments'] as const,
  health: () => [...shipmentKeys.all, 'health'] as const,
  list: () => [...shipmentKeys.all, 'list'] as const,
  detail: (id: string) => [...shipmentKeys.all, 'detail', id] as const,
};

function buildFallbackSummary(s: Shipment): ShipmentSummary {
  const route = s.routes.find((r) => r.id === s.selected_route_id) ?? s.routes[0];
  return {
    id: s.id, title: s.title, origin: s.origin.name, destination: s.destination.name,
    movement_status: s.movement_status, eta: route?.eta.p50 ?? null,
    miss_probability: s.forecast.miss_probability, passport_status: s.passport.status,
  };
}

export function useHealthQuery() {
  const client = createCaspianClient(API_BASE_URL, () => 'logistician');
  return useQuery({
    queryKey: shipmentKeys.health(),
    queryFn: async () => client.health(),
    retry: 0,
    refetchInterval: 15000,
  });
}

export function useShipmentsListQuery(role: Role) {
  const client = createCaspianClient(API_BASE_URL, () => role);
  const query = useQuery({
    queryKey: shipmentKeys.list(),
    queryFn: () => client.listShipments(),
    placeholderData: { items: [buildFallbackSummary(SEED_SHIPMENT)] },
  });
  return { ...query, data: query.data ?? { items: [buildFallbackSummary(SEED_SHIPMENT)] } };
}

export function useShipmentDetailQuery(id: string, role: Role) {
  const client = createCaspianClient(API_BASE_URL, () => role);
  const query = useQuery({
    queryKey: shipmentKeys.detail(id),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    queryFn: () => client.getShipment(id),
    placeholderData: SEED_SHIPMENT,
    enabled: Boolean(id),
  });
  return { ...query, data: query.data ?? SEED_SHIPMENT };
}
