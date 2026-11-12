'use client';

import type { Route, Shipment } from '@/shared/api/caspian';
import { formatProbability, formatRubFromMinor } from '@/shared/lib/formatters';
import styles from './HeroKpiGrid.module.css';

interface HeroKpiGridProps {
  shipment: Shipment;
  selectedRoute?: Route;
  stormActive: boolean;
}

export function HeroKpiGrid({ shipment, selectedRoute, stormActive }: HeroKpiGridProps) {
  const riskValue = formatProbability(shipment.forecast.miss_probability);
  const costValue = selectedRoute && selectedRoute.cost.amount_minor > 0 ? formatRubFromMinor(selectedRoute.cost.amount_minor) : 'Тариф не подтверждён';
  const ecoValue =
    selectedRoute && selectedRoute.emissions_kg_co2e !== null
      ? `${selectedRoute.emissions_kg_co2e} кг CO₂e`
      : 'Нет данных';

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <span className={styles.label}>01 / МАРШРУТ</span>
        <span className={styles.value}>{shipment.origin.name} → {shipment.destination.name}</span>
        <span className={styles.sub}>{shipment.title} · {shipment.mass_tonnes} т</span>
      </div>
      <div className={styles.card}>
        <span className={styles.label}>{'02 / ПРОПУСК CUTOFF'}</span>
        <span className={`${styles.value} ${stormActive ? styles.thermal : styles.cyan}`}>{riskValue}</span>
        <span className={styles.sub}>{stormActive ? 'Шторм · сценарий' : 'Расчёт по условиям сценария'}</span>
      </div>
      <div className={styles.card}>
        <span className={styles.label}>03 / ТАРИФ · СЦЕНАРИЙ</span>
        <span className={styles.value}>{costValue}</span>
        <span className={styles.sub}>{selectedRoute ? selectedRoute.name : 'Маршрут не выбран'}</span>
      </div>
      <div className={styles.card}>
        <span className={styles.label}>{'04 / УГЛЕРОДНЫЙ СЛЕД'}</span>
        <span className={`${styles.value} ${styles.eco}`}>{ecoValue}</span>
        <span className={styles.sub}>ATTESTATION V{shipment.passport.version} · {shipment.passport.status.toUpperCase()}</span>
      </div>
    </div>
  );
}
