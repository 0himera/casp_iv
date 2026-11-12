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
      <span className={styles.item}>
        <i className={`${styles.line} ${styles.rail}`} /> Выбранный маршрут
      </span>
      <span className={styles.item}>
        <i className={`${styles.line} ${styles.sea}`} /> Альтернатива
      </span>
      <span className={styles.item}>
        <i className={`${styles.zone} ${stormActive ? styles.storm : styles.calm}`} />
        {stormActive ? 'Шторм (сценарий)' : 'Акватория Энзели (схема)'}
      </span>
      <span className={styles.schematicTag}>Схема маршрута{missing.length ? ` · нет координат: ${missing.join(", ")}` : ""}</span>
    </div>
  );
}
