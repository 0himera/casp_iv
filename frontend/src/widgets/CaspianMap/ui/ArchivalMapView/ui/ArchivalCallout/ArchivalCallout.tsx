'use client';

import type { CaspianPort } from '@/entities/cargo';
import styles from './ArchivalCallout.module.css';

interface ArchivalCalloutProps {
  port: CaspianPort;
  xPercent: number;
  yPercent: number;
}

export function ArchivalCallout({ port, xPercent, yPercent }: ArchivalCalloutProps) {
  const left = xPercent > 62 ? Math.max(4, xPercent - 25) : Math.min(72, xPercent + 2.5);
  const top = yPercent < 24 ? yPercent + 3.5 : Math.max(8, yPercent - 12);
  const wind = port.live?.windSpeed ?? port.windSpeedKmh;

  return (
    <aside className={styles.callout} style={{ left: `${left}%`, top: `${top}%` }}>
      <div className={styles.header}>
        <span className={styles.title}>{port.name}</span>
        <span className={styles.tag}>{port.country}</span>
      </div>
      <div className={styles.coord}>
        {port.lat.toFixed(2)}°N · {port.lng.toFixed(2)}°E
      </div>
      <div className={styles.metrics}>
        <span>ВЕТЕР {wind} км/ч</span>
        <span>ВОЛНА {port.waveHeightM} м</span>
        <span>ГЛУБ. {port.waterDepthM} м</span>
      </div>
    </aside>
  );
}
