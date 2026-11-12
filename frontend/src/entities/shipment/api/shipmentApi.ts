import { useQuery } from '@tanstack/react-query';
import { SEED_SHIPMENT } from '@/data/caspianSnapshots';
import { createCaspianClient, type Role, type Shipment, type ShipmentSummary } from '@/shared/api/caspian';
import { enrichShipmentWithCorridors } from '../lib/enrichShipment';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://150.251.112.240:18081/api/v1';

export const shipmentKeys = {
  all: ['caspian-shipments'] as const,
  health: () => [...shipmentKeys.all, 'health'] as const,
  list: (role: Role) => [...shipmentKeys.all, 'list', role] as const,
  detail: (id: string, role: Role) => [...shipmentKeys.all, 'detail', id, role] as const,
};

function buildFallbackSummary(s: Shipment): ShipmentSummary {
  const route = s.routes.find((r) => r.id === s.selected_route_id) ?? s.routes[0];
  return {
    id: s.id,
    title: s.title,
    origin: s.origin.name,
    destination: s.destination.name,
    movement_status: s.movement_status,
    eta: route?.eta.p50 ?? null,
    miss_probability: s.forecast.miss_probability,
    passport_status: s.passport.status,
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

export function useShipmentsListQuery(role: Role, apiOnline: boolean) {
  const client = createCaspianClient(API_BASE_URL, () => role);
  return useQuery({
    queryKey: shipmentKeys.list(role),
    queryFn: async () => (apiOnline ? client.listShipments() : { items: [buildFallbackSummary(SEED_SHIPMENT)] }),
    initialData: { items: [buildFallbackSummary(SEED_SHIPMENT)] },
  });
}

export function useShipmentDetailQuery(id: string, role: Role, apiOnline: boolean) {
  const client = createCaspianClient(API_BASE_URL, () => role);
  return useQuery({
    queryKey: shipmentKeys.detail(id, role),
    queryFn: async () => enrichShipmentWithCorridors(apiOnline ? await client.getShipment(id) : SEED_SHIPMENT),
    initialData: enrichShipmentWithCorridors(SEED_SHIPMENT),
  });
}
