'use client';

import type { CaspianPort } from '@/entities/cargo';
import styles from './TelemetryCallout.module.css';

interface TelemetryCalloutProps { port: CaspianPort; isDanger: boolean; xrayMode?: boolean; }

export function TelemetryCallout({ port, isDanger, xrayMode }: TelemetryCalloutProps) {
  const live = port.live;
  const isStorm = isDanger || (!live && port.status === 'storm_restricted');
  const badgeText = isStorm ? '[ ШТОРМ / СЦЕНАРИЙ ]' : live ? (!live.weatherAt ? '[ НЕТ ПОГОДЫ ]' : live.weatherStale ? '[ ПРИГНОЗ УСТАРЕЛ ]' : '[ ПРОГНОЗ ПОГОДЫ ]') : '[ ДЕМО ]';
  const badgeClass = isStorm ? styles.badgeDanger : styles.badgeSafe;
  return (
    <div className={`${styles.box} ${isStorm ? styles.boxDanger : ''} ${xrayMode ? styles.boxXray : ''}`}>
      <div className={styles.topRow}>
        <span className={styles.name}>{port.name} <span className={styles.country}>[{port.country}]</span></span>
        <span className={badgeClass}>{badgeText}</span>
      </div>
      <div className={styles.coords}>{port.lat.toFixed(2)}°N · {port.lng.toFixed(2)}°E</div>
      {live ? <div className={styles.grid}>
        <span>ВЕТЕР: {live.windSpeed === null ? 'нет данных' : `${live.windSpeed} км/ч`}</span>
        <span>ЗАХОДЫ: {live.portCalls === null ? 'нет данных' : `${live.portCalls} / день`}</span>
        <span>{live.activityDate ? `${live.activityDate}${live.activityStale ? ' · устарело' : ''}` : 'Портовые данные недоступны'}</span>
      </div> : <div className={styles.grid}>
        <span>В: {port.waveHeightM}м</span><span>ВЕТЕР: {port.windSpeedKmh}км/ч</span>
        <span>ПРИЧАЛЫ: {port.berthsAvailable}/{port.totalBerths} ({port.loadPercent}%)</span>
      </div>}
      <div className={styles.archive}>{port.archiveIndex}</div>
    </div>
  );
}
