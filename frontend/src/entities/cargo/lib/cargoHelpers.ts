import type { CargoStatus, EsgMetrics } from '../model/types';

export function getCargoStatusLabel(status: CargoStatus): string {
  if (status === 'critical') return 'Критическая стыковка';
  if (status === 'delay-risk') return 'Риск задержки';
  return 'В пути';
}

export function getCargoBadgeVariant(
  status: CargoStatus
): 'destructive' | 'warning' | 'success' {
  if (status === 'critical') return 'destructive';
  if (status === 'delay-risk') return 'warning';
  return 'success';
}

export function calculateEsgSummary(esg: EsgMetrics) {
  const totalCurrentKg = esg.railKg + esg.seaKg + esg.roadKg;
  const savedKg = Math.max(0, esg.pureRoadKg - totalCurrentKg);
  const reductionPercent = Math.round((savedKg / esg.pureRoadKg) * 100);
  return { totalCurrentKg, savedKg, reductionPercent };
}

