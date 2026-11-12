'use client';

import type { EsgRecalculationResult } from '@/entities/shipment';
import styles from './EsgSummaryBlock.module.css';

const kg = (value: number | null) => value === null ? 'Нет расчёта' : `${Math.round(value * 100) / 100} кг CO₂e`;
export function EsgSummaryBlock({ esg }: { esg: EsgRecalculationResult }) {
  return <div className={styles.summaryRow}>
    <div className={styles.topValues}><div>
      <div className={styles.summaryLabel}>Выбросы выбранного маршрута · сценарий</div>
      <div className={styles.summaryValue}>{kg(esg.totalCurrentKg)}</div>
    </div></div>
    <div className={styles.deltaGrid}>
      <div className={styles.metricItem}><span className={styles.metricLabel}>Условный автосценарий</span><span className={styles.metricValue}>{kg(esg.pureRoadBaselineKg)}</span></div>
      <div className={styles.metricItem}><span className={styles.metricLabel}>Разница с автосценарием</span><span className={styles.metricValue}>{esg.savedKg === null ? '—' : kg(-esg.savedKg)}</span></div>
      <div className={styles.metricItem}><span className={styles.metricLabel}>Δ к первому маршруту</span><span className={styles.metricValue}>{kg(esg.deltaVsBaseKg)}</span></div>
    </div>
  </div>;
}
