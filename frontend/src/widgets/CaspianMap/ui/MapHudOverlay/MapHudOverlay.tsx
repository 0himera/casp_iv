'use client';

import { Loader2 } from 'lucide-react';
import styles from './MapHudOverlay.module.css';

interface MapHudOverlayProps {
  stormActive: boolean;
  isBusy?: boolean;
}

export function MapHudOverlay({ stormActive, isBusy }: MapHudOverlayProps) {
  return (
    <div className={styles.hud} aria-hidden="true">
      <div className={styles.cornerTopLeft} />
      <div className={styles.cornerTopRight} />
      <div className={styles.cornerBottomLeft} />
      <div className={styles.cornerBottomRight} />
      {isBusy && (
        <div className={styles.busyBanner}>
          <Loader2 className={styles.spinIcon} />
          <span>[ ВЕРИФИКАЦИЯ МАРШРУТА В КАСПИЙСКОЙ СЕТИ... ]</span>
        </div>
      )}
      <div className={styles.topStamp}>
        <span>{'ГЛУБИНА И МОРСКИЕ МАРШРУТЫ'}</span>
        <span className={stormActive ? styles.stormTag : styles.nominalTag}>
          {stormActive ? 'ШТОРМ · СЦЕНАРИЙ' : 'ПОГОДНЫЙ СЛОЙ'}
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

