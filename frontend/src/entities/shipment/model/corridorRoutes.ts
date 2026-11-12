import type { Route } from '@/shared/api/caspian';

export const AKTAU_ROUTE: Route = {
  id: 'route_aktau',
  name: 'Через Актау (Восточный коридор)',
  ports: ['Актау', 'Амирабад'],
  modes: ['rail', 'sea'],
  distance_km: 1950,
  geometry: {
    type: 'LineString',
    coordinates: [[44.5, 48.7], [51.88, 47.1], [51.23, 43.6], [52.5, 40.0], [53.37, 36.85]],
  },
  geometry_kind: 'schematic',
  eta: { p10: '2026-11-15T22:00:00Z', p50: '2026-11-16T04:00:00Z', p90: '2026-11-16T12:00:00Z' },
  miss_probability: 0.12,
  cost: { amount_minor: 28000000, currency: 'RUB' },
  emissions_kg_co2e: 480,
  emissions_method: 'Условные коэффициенты; перевозка без терминальных операций',
  feasible: true,
  infeasibility_reason: null,
  capacity_status: 'synthetic',
  requires_reapproval: true,
  source_ids: ['demo', 'kuryk'],
};

export const TURKMEN_ROUTE: Route = {
  id: 'route_turkmen',
  name: 'Через Туркменбаши (Юго-Восточный)',
  ports: ['Туркменбаши', 'Амирабад'],
  modes: ['rail', 'sea'],
  distance_km: 2150,
  geometry: {
    type: 'LineString',
    coordinates: [[44.5, 48.7], [51.23, 43.6], [53.01, 40.01], [53.37, 36.85]],
  },
  geometry_kind: 'schematic',
  eta: { p10: '2026-11-16T06:00:00Z', p50: '2026-11-16T14:00:00Z', p90: '2026-11-16T22:00:00Z' },
  miss_probability: 0.18,
  cost: { amount_minor: 29500000, currency: 'RUB' },
  emissions_kg_co2e: 610,
  emissions_method: 'Условные коэффициенты; перевозка без терминальных операций',
  feasible: true,
  infeasibility_reason: null,
  capacity_status: 'synthetic',
  requires_reapproval: true,
  source_ids: ['demo'],
};
