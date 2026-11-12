'use client';

import { TrendingDown } from 'lucide-react';
import { getSelectedRoute } from '@/entities/shipment';
import type { Shipment } from '@/shared/api/caspian';
import { Badge, PixelMarker, Separator, ViewfinderFrame } from '@/shared/ui';
import { EmissionBarRow } from '../EmissionBarRow';
import { TimelinePanel } from '../TimelinePanel';
import styles from './EsgWidget.module.css';

interface EsgWidgetProps {
  shipment: Shipment;
}

export function EsgWidget({ shipment }: EsgWidgetProps) {
  const selected = getSelectedRoute(shipment);
  const maxKg = Math.max(...shipment.routes.map((r) => r.emissions_kg_co2e ?? 0), 1);
  const minKg = Math.min(...shipment.routes.map((r) => r.emissions_kg_co2e ?? Infinity));
  const currentKg = selected.emissions_kg_co2e;
  const savedPercent = currentKg !== null && maxKg > 0 ? Math.round(((maxKg - currentKg) / maxKg) * 100) : 0;

  return (
    <ViewfinderFrame stamp="ESG и журнал" className={styles.card}>
      <div className={styles.titleRow}>
        <span className={styles.titleWrap}>
          <PixelMarker variant="verified" />
          <h3 className={styles.heading}>Баланс <em className={styles.headingItalic}>ESG-метрик</em></h3>
        </span>
        <Badge variant={currentKg !== null && currentKg <= minKg ? 'success' : 'warning'} className={styles.collageBadge}>
          {currentKg !== null && currentKg <= minKg ? 'ESG: A+' : 'ESG: B'}
        </Badge>
      </div>
      <div className={styles.summaryRow}>
        <div>
          <div className={styles.summaryLabel}>Выбросы выбранного маршрута</div>
          <div className={styles.summaryValue}>{currentKg !== null ? `${currentKg} кг CO₂e` : 'Нет данных'}</div>
        </div>
        {savedPercent > 0 && (
          <div className={styles.reductionTag}><TrendingDown className={styles.trendIcon} /><span>-{savedPercent}%</span></div>
        )}
      </div>
      <div className={styles.bars}>
        {shipment.routes.map((r) => (
          <EmissionBarRow key={r.id} label={r.name} kg={r.emissions_kg_co2e ?? 0} maxKg={maxKg} toneClass={r.id === selected.id ? 'bg-[var(--status-success)]' : 'bg-[var(--mode-road)]'} />
        ))}
      </div>
      <div className={styles.savedNote}>{selected.emissions_method}</div>
      <Separator />
      <TimelinePanel events={shipment.timeline} />
    </ViewfinderFrame>
  );
}
