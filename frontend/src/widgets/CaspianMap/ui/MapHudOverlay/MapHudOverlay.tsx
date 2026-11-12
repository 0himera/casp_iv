'use client';

import styles from './MapHudOverlay.module.css';

interface MapHudOverlayProps {
  stormActive: boolean;
}

export function MapHudOverlay({ stormActive }: MapHudOverlayProps) {
  return (
    <div className={styles.hud} aria-hidden="true">
      <div className={styles.cornerTopLeft} />
      <div className={styles.cornerTopRight} />
      <div className={styles.cornerBottomLeft} />
      <div className={styles.cornerBottomRight} />
      <div className={styles.topStamp}>
        <span>{'LAT 36.5°N–47.2°N · LON 46.8°E–54.1°E // BATHYMETRY'}</span>
        <span className={stormActive ? styles.stormTag : styles.nominalTag}>
          {stormActive ? 'ANOMALY // SEA-STATE 6' : 'NOMINAL // SEA-STATE 2'}
        </span>
      </div>
      <div className={styles.depthScale}>
        <span className={styles.depthTitle}>ГЛУБИНА</span>
        <div className={styles.depthBarWrap}>
          <div className={styles.depthBar} />
          <div className={styles.depthTicks}>
            <span>0м</span>
            <span>-450м</span>
            <span>-1025м</span>
          </div>
        </div>
      </div>
    </div>
  );
}
