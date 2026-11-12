'use client';

import { ArrowRight } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { formatProbability } from '@/shared/lib/formatters';
import { Badge, Button } from '@/shared/ui';
import styles from './RecommendationBanner.module.css';

export function RecommendationBanner({ shipment, canSelectRoute, isBusy, onRerouteAlternative }: {
  shipment: Shipment; canSelectRoute: boolean; isBusy: boolean; onRerouteAlternative?: () => void;
}) {
  const alternative = shipment.routes.filter((r) => r.id !== shipment.selected_route_id && r.feasible && r.miss_probability !== null)
    .sort((a, b) => a.miss_probability! - b.miss_probability!)[0];
  const current = shipment.forecast.miss_probability;
  if (!alternative || current === null || alternative.miss_probability! >= current) return null;
  return <div className={`${styles.card} ${styles.success}`}>
    <div className={styles.header}><span>Альтернатива по текущему расчёту: {alternative.name}</span>
      <Badge variant="secondary">Риск: {formatProbability(alternative.miss_probability)}</Badge></div>
    <p className={styles.body}>Тот же пункт назначения: {shipment.destination.name}. Потребуется новая версия паспорта и повторное согласование. Рейсы и места заданы сценарием.</p>
    <Button size="sm" disabled={!canSelectRoute || isBusy} onClick={onRerouteAlternative}>Выбрать рассчитанную альтернативу <ArrowRight size={12} /></Button>
  </div>;
}
