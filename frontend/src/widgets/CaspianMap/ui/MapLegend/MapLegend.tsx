'use client';

import styles from './MapLegend.module.css';

interface MapLegendProps {
  stormActive: boolean;
}

export function MapLegend({ stormActive }: MapLegendProps) {
  return (
    <div className={styles.legend}>
      <span className={styles.item}>
        <i className={`${styles.line} ${styles.rail}`} /> Ж/Д плечо
      </span>
      <span className={styles.item}>
        <i className={`${styles.line} ${styles.sea}`} /> Морской паром
      </span>
      <span className={styles.item}>
        <i className={`${styles.line} ${styles.road}`} /> Авто
      </span>
      <span className={styles.item}>
        <i className={`${styles.zone} ${stormActive ? styles.storm : styles.calm}`} />
        {stormActive ? 'Шторм Энзели (3.8 м)' : 'Район Энзели'}
      </span>
    </div>
  );
}

