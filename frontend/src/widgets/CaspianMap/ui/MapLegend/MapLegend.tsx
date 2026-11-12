'use client';

import styles from './MapLegend.module.css';

interface MapLegendProps {
  stormActive: boolean;
}

export function MapLegend({ stormActive }: MapLegendProps) {
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
        {stormActive ? 'Шторм (сценарий)' : 'Акватория Энзели'}
      </span>
      <span className={styles.schematicTag}>Схема маршрута</span>
    </div>
  );
}
