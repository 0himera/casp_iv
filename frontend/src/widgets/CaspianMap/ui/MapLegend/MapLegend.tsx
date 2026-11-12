'use client';

import { useLiveOverview } from '@/entities/cargo';
import styles from './MapLegend.module.css';

interface MapLegendProps {
  stormActive: boolean;
}

export function MapLegend({ stormActive }: MapLegendProps) {
  const live = useLiveOverview();
  const missing = live.data?.items.filter((item) => !item.port.coordinates).map((item) => item.port.name) ?? [];
  return (
    <div className={styles.legend}>
      <div className={styles.items}>
        <span className={styles.item}>
          <i className={`${styles.line} ${styles.rail}`} /> Выбранный вектор
        </span>
        <span className={styles.item}>
          <i className={`${styles.line} ${styles.sea}`} /> Альтернатива / маска воды
        </span>
        <span className={styles.item}>
          <i className={`${styles.zone} ${stormActive ? styles.storm : styles.calm}`} />
          {stormActive ? 'Шторм (термальная аномалия)' : 'Акватория Энзели'}
        </span>
      </div>
      <span className={styles.schematicTag}>
        SCALE 1:2,500,000 · BATHYMETRIC OPTICAL{missing.length ? ` · НЕТ КООРДИНАТ: ${missing.join(', ')}` : ''}
      </span>
    </div>
  );
}
