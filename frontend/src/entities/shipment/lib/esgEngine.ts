import type { Shipment } from '@/shared/api/caspian';

export interface EsgModeContribution {
  mode: 'rail' | 'sea' | 'road';
  label: string;
  kg: number;
}
export interface EsgRecalculationResult {
  totalCurrentKg: number | null;
  pureRoadBaselineKg: number | null;
  savedKg: number | null;
  reductionPercent: number | null;
  deltaVsBaseKg: number | null;
  modesBreakdown: EsgModeContribution[];
  source: string;
}
const labels = { rail: 'Ж/Д плечо', sea: 'Морское плечо', road: 'Автоплечо' };

export function recalculateEsg(shipment: Shipment): EsgRecalculationResult {
  const selected = shipment.routes.find((r) => r.id === shipment.selected_route_id)!;
  const total = selected.emissions_kg_co2e;
  const baseline = shipment.planning?.road_baseline_kg_co2e ?? null;
  const parts = shipment.planning?.emissions.routes.find((r) => r.route_id === selected.id);
  const base = shipment.routes[0]?.emissions_kg_co2e ?? null;
  return {
    totalCurrentKg: total, pureRoadBaselineKg: baseline,
    savedKg: baseline !== null && total !== null ? baseline - total : null,
    reductionPercent: baseline && total !== null ? Math.round((1 - total / baseline) * 100) : null,
    deltaVsBaseKg: total !== null && base !== null ? total - base : null,
    modesBreakdown: parts ? Object.entries(parts.by_mode_kg_co2e).map(([mode, kg]) => ({
      mode: mode as EsgModeContribution['mode'], label: labels[mode as keyof typeof labels], kg: Math.round(kg * 100) / 100,
    })) : [],
    source: shipment.planning?.emissions.factor_source ?? selected.emissions_method,
  };
}
