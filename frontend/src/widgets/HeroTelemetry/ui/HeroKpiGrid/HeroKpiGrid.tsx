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
  const costValue = selectedRoute ? formatRubFromMinor(selectedRoute.cost.amount_minor) : '—';
  const ecoValue =
    selectedRoute && selectedRoute.emissions_kg_co2e !== null
      ? `${selectedRoute.emissions_kg_co2e} кг CO₂e`
      : 'Нет данных';

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <span className={styles.label}>[ ACTIVE CORRIDOR ]</span>
        <span className={styles.value}>{shipment.origin.name} → {shipment.destination.name}</span>
        <span className={styles.sub}>{shipment.title} · {shipment.mass_tonnes} т</span>
      </div>
      <div className={styles.card}>
        <span className={styles.label}>{'[ MISS RISK // P50 ]'}</span>
        <span className={`${styles.value} ${stormActive ? styles.thermal : styles.cyan}`}>{riskValue}</span>
        <span className={styles.sub}>{stormActive ? 'CRITICAL STORM ANOMALY' : 'NOMINAL HYDRO-REGIME'}</span>
      </div>
      <div className={styles.card}>
        <span className={styles.label}>[ FREIGHT TARIFF ]</span>
        <span className={styles.value}>{costValue}</span>
        <span className={styles.sub}>{selectedRoute ? selectedRoute.name : 'Маршрут не выбран'}</span>
      </div>
      <div className={styles.card}>
        <span className={styles.label}>{'[ ECO // CARBON ]'}</span>
        <span className={`${styles.value} ${styles.eco}`}>{ecoValue}</span>
        <span className={styles.sub}>ATTESTATION V{shipment.passport.version} · {shipment.passport.status.toUpperCase()}</span>
      </div>
    </div>
  );
}
