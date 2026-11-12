'use client';

import { TrendingDown } from 'lucide-react';
import type { EsgRecalculationResult } from '@/entities/shipment';
import { Badge } from '@/shared/ui';
import styles from './EsgSummaryBlock.module.css';

interface EsgSummaryBlockProps {
  esg: EsgRecalculationResult;
}

export function EsgSummaryBlock({ esg }: EsgSummaryBlockProps) {
  return (
    <div className={styles.summaryRow}>
      <div className={styles.topValues}>
        <div>
          <div className={styles.summaryLabel}>Выбросы маршрута (демо)</div>
          <div className={styles.summaryValue}>{esg.totalCurrentKg} кг CO₂e</div>
        </div>
        <Badge variant={esg.rating === 'A+' ? 'success' : 'warning'}>
          <TrendingDown size={12} /> -{esg.reductionPercent}% vs Авто
        </Badge>
      </div>
      <div className={styles.deltaGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>База чистый авто</span>
          <span className={styles.metricValue}>{esg.pureRoadBaselineKg} кг</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Экономия CO₂</span>
          <span className={`${styles.metricValue} ${styles.positiveDelta}`}>
            -{esg.savedKg} кг
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Δ смены маршрута</span>
          <span className={`${styles.metricValue} ${esg.deltaVsBaseKg < 0 ? styles.positiveDelta : ''}`}>
            {esg.deltaVsBaseKg === 0 ? '0 кг (базовый)' : `${esg.deltaVsBaseKg} кг CO₂e`}
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Демо-рейтинг</span>
          <span className={`${styles.metricValue} ${styles.positiveDelta}`}>
            {esg.rating} {esg.rating === 'A+' ? '(Оптимум)' : '(Стандарт)'}
          </span>
        </div>
      </div>
    </div>
  );
}
