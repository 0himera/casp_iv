import type { Role, Route, Shipment } from '@/shared/api/caspian';
import type { MultimodalNodeData, NodeStatus } from '@/shared/types/transit';
import { formatMskDateTime } from '@/shared/lib/formatters';

export { buildMapRoutesGeoJson } from './routeGeoJson';

export function getSelectedRoute(shipment: Shipment): Route {
  return shipment.routes.find((r) => r.id === shipment.selected_route_id) ?? shipment.routes[0];
}

export function getRoleLabel(role: Role): string {
  if (role === 'logistician') return 'Логист';
  if (role === 'carrier') return 'Перевозчик';
  return 'Таможня';
}

export function getPassportStatusLabel(status: Shipment['passport']['status']): string {
  if (status === 'ready') return 'Комплект согласован';
  if (status === 'blocked') return 'Отклонён';
  return 'Сбор подписей';
}

export function getMovementStatusLabel(status: Shipment['movement_status']): string {
  if (status === 'delivered') return 'Доставлен';
  if (status === 'at_port') return 'В порту';
  if (status === 'planned') return 'Запланирован';
  return 'В пути';
}

export function buildGraphNodesFromShipment(shipment: Shipment, route: Route): MultimodalNodeData[] {
  const prob = route.miss_probability;
  const riskStatus: NodeStatus =
    prob === null ? 'warning' : prob >= 0.5 ? 'critical' : prob >= 0.2 ? 'warning' : 'ok';
  const input = shipment.planning?.inputs.find((x) => x.route_id === route.id);
  const firstPort = route.ports[0] ?? 'Порт погрузки';
  const lastPort = route.ports.at(-1) ?? shipment.destination.name;
  const landMode = route.modes[0] === 'road' ? 'road' : 'rail';
  return [
    { id: 'n1', label: landMode === 'road' ? 'Автотерминал' : 'Ж/Д терминал', location: shipment.origin.name, mode: landMode, status: 'ok', delayHours: 0, eta: formatMskDateTime(shipment.scenario_time) },
    { id: 'n2', label: 'Порт погрузки', location: firstPort, mode: 'sea', status: riskStatus, delayHours: input?.terminal_hours ?? 0, eta: formatMskDateTime(shipment.forecast.ready_at.p50) },
    { id: 'n3', label: 'Морской паром', location: `${firstPort} → ${lastPort}`, mode: 'sea', status: riskStatus, delayHours: input?.weather_hold_hours ?? 0, eta: formatMskDateTime(shipment.forecast.cargo_cutoff) },
    { id: 'n4', label: 'Паспорт / Pre-clearance', location: `v${shipment.passport.version} (${getPassportStatusLabel(shipment.passport.status)})`, mode: 'customs', status: shipment.passport.status === 'ready' ? 'ok' : shipment.passport.status === 'blocked' ? 'critical' : 'warning', delayHours: 0, eta: formatMskDateTime(shipment.updated_at) },
    { id: 'n5', label: 'Порт выгрузки', location: lastPort, mode: 'sea', status: route.feasible ? 'ok' : 'critical', delayHours: 0, eta: formatMskDateTime(route.eta.p50) },
    { id: 'n6', label: 'Приёмка груза', location: shipment.destination.name, mode: 'road', status: route.feasible ? 'ok' : 'warning', delayHours: 0, eta: formatMskDateTime(route.eta.p90) },
  ];
}
