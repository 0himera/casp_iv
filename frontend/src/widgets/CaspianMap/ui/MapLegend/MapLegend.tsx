'use client';

import { useLiveOverview } from '@/entities/cargo';
import styles from './MapLegend.module.css';

interface MapLegendProps {
  stormActive: boolean;
  showStorm?: boolean;
  showCorridors?: boolean;
  showGrid?: boolean;
  onToggleStormLayer?: () => void;
  onToggleCorridorsLayer?: () => void;
  onToggleGridLayer?: () => void;
}

export function MapLegend(p: MapLegendProps) {
  const live = useLiveOverview();
  const missing = live.data?.items.filter((i) => !i.port.coordinates).map((i) => i.port.name) ?? [];
  return (
    <div className={styles.legend}>
      <div className={styles.items}>
        <span className={styles.item}><i className={`${styles.line} ${styles.rail}`} /> Выбранный маршрут</span>
        <button type="button" onClick={p.onToggleCorridorsLayer} className={`${styles.toggleItem} ${p.showCorridors ? styles.on : styles.off}`}>
          <i className={`${styles.line} ${styles.sea}`} /> Коридоры
        </button>
        <button type="button" onClick={p.onToggleStormLayer} className={`${styles.toggleItem} ${p.showStorm ? styles.on : styles.off}`}>
          <i className={`${styles.zone} ${p.stormActive ? styles.storm : styles.calm}`} />
          {p.stormActive ? 'Шторм-зона' : 'Акватория Энзели'}
        </button>
        <button type="button" onClick={p.onToggleGridLayer} className={`${styles.toggleItem} ${p.showGrid ? styles.on : styles.off}`}>
          Сетка 2°
        </button>
      </div>
      <span className={styles.schematicTag}>
        SCALE 1:2,500,000{missing.length ? ` · НЕТ КООРДИНАТ: ${missing.join(', ')}` : ''}
      </span>
    </div>
  );
}
