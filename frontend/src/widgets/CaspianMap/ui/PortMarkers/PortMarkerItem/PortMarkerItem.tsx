'use client';

import type { CaspianPort } from '@/entities/cargo';
import styles from './PortMarkerItem.module.css';

interface PortMarkerItemProps {
  port: CaspianPort;
  isDanger: boolean;
  xrayMode?: boolean;
  isSelected?: boolean;
  onClick?: (port: CaspianPort) => void;
}

const LEFT_PORTS = new Set(['makhachkala', 'anzali', 'baku', 'alat']);

function getAlignClass(id: string): string {
  if (LEFT_PORTS.has(id)) return styles.left;
  if (id === 'kuryk') return styles.downRight;
  if (id === 'aktau') return styles.upRight;
  return styles.right;
}

export function PortMarkerItem({ port, isDanger, isSelected, onClick }: PortMarkerItemProps) {
  const wind = port.live?.windSpeed ?? (port.live?.demoMetricsAvailable ? port.windSpeedKmh : null);

  return (
    <div
      className={styles.container}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(port);
      }}
    >
      <span className={`${styles.beacon} ${isDanger ? styles.beaconDanger : ''} ${isSelected ? styles.beaconSelected : ''}`} />
      <span className={`${styles.pill} ${getAlignClass(port.id)} ${isDanger ? styles.pillDanger : ''} ${isSelected ? styles.pillSelected : ''}`}>
        <span>{port.name}</span>
        {wind !== null && <span className={styles.wind}>{Math.round(wind)}</span>}
      </span>
    </div>
  );
}
