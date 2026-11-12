'use client';

import { useLiveOverview } from '@/entities/cargo';
import styles from './MapLegend.module.css';

interface MapLegendProps {
  stormActive: boolean; showStorm?: boolean; showCorridors?: boolean; showGrid?: boolean;
  onToggleStormLayer?: () => void; onToggleCorridorsLayer?: () => void; onToggleGridLayer?: () => void;
}

export function MapLegend(p: MapLegendProps) {
  const live = useLiveOverview();
  const missing = live.data?.items.filter((i) => !i.port.coordinates).map((i) => i.port.name) ?? [];
  return (
    <div className={styles.legend}>
      <div className={styles.items}>
        <span className={styles.item}><i className={`${styles.line} ${styles.rail}`} /> Маршрут</span>
        <button type="button" onClick={p.onToggleCorridorsLayer} className={`${styles.toggleItem} ${p.showCorridors ? styles.on : styles.off}`}><i className={`${styles.line} ${styles.sea}`} /> Коридоры</button>
        <button type="button" onClick={p.onToggleStormLayer} className={`${styles.toggleItem} ${p.showStorm ? styles.on : styles.off}`}><i className={`${styles.zone} ${p.stormActive ? styles.storm : styles.calm}`} /> {p.stormActive ? 'Шторм' : 'Энзели'}</button>
        <button type="button" onClick={p.onToggleGridLayer} className={`${styles.toggleItem} ${p.showGrid ? styles.on : styles.off}`}>Сетка 2°</button>
        <span className={styles.depthScale}><i className={styles.d1} />0–15м <i className={styles.d2} />180м <i className={styles.d3} />-1025м</span>
      </div>
      <span className={styles.schematicTag}>BATHYMETRIC 1:2.5M{missing.length ? ` · НЕТ КООРД: ${missing.join(', ')}` : ''}</span>
    </div>
  );
}
