export interface EsgModeContribution {
  mode: 'rail' | 'sea' | 'road';
  label: string;
  kg: number;
}

export interface EsgRecalculationResult {
  totalCurrentKg: number;
  pureRoadBaselineKg: number;
  savedKg: number;
  reductionPercent: number;
  deltaVsBaseKg: number;
  rating: 'A+' | 'B';
  modesBreakdown: EsgModeContribution[];
}

export const GLEC_FACTORS = {
  rail: 0.022,
  sea: 0.015,
  road: 0.062,
} as const;

export const PURE_ROAD_BASELINE_KG = 6420;
export const BASE_ROUTE_KG = 2880;
export const REROUTED_ROUTE_KG = 2520;

export function recalculateEsg(routeId: string): EsgRecalculationResult {
  const isAlternative = routeId === 'route_makh';
  const totalCurrentKg = isAlternative ? REROUTED_ROUTE_KG : BASE_ROUTE_KG;
  const savedKg = PURE_ROAD_BASELINE_KG - totalCurrentKg;
  const reductionPercent = Math.round((savedKg / PURE_ROAD_BASELINE_KG) * 100);
  const deltaVsBaseKg = totalCurrentKg - BASE_ROUTE_KG;
  const rating: 'A+' | 'B' = isAlternative ? 'A+' : 'B';

  const modesBreakdown: EsgModeContribution[] = isAlternative
    ? [
        { mode: 'rail', label: 'Ж/Д плечо', kg: 1420 },
        { mode: 'sea', label: 'Морской паром', kg: 890 },
        { mode: 'road', label: 'Автодовоз', kg: 210 },
      ]
    : [
        { mode: 'rail', label: 'Ж/Д плечо', kg: 1180 },
        { mode: 'sea', label: 'Морской паром', kg: 940 },
        { mode: 'road', label: 'Автодовоз', kg: 760 },
      ];

  return {
    totalCurrentKg,
    pureRoadBaselineKg: PURE_ROAD_BASELINE_KG,
    savedKg,
    reductionPercent,
    deltaVsBaseKg,
    rating,
    modesBreakdown,
  };
}
