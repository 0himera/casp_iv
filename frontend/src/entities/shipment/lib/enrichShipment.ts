import type { Shipment } from '@/shared/api/caspian';
import { AKTAU_ROUTE, TURKMEN_ROUTE } from '../model/corridorRoutes';

export function enrichShipmentWithCorridors(shipment: Shipment): Shipment {
  const routes = [...shipment.routes];
  if (!routes.some((r) => r.id === 'route_aktau')) routes.push(AKTAU_ROUTE);
  if (!routes.some((r) => r.id === 'route_turkmen')) routes.push(TURKMEN_ROUTE);
  return { ...shipment, routes };
}

