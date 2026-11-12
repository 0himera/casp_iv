'use client';

import type { CaspianPort } from '@/entities/cargo';
import { getLeaderLineConfig } from '../../../model/calloutDirections';
import { BioOpticReticle } from '../BioOpticReticle';
import { TelemetryCallout } from '../TelemetryCallout';
import styles from './PortMarkerItem.module.css';

interface PortMarkerItemProps {
  port: CaspianPort;
  isDanger: boolean;
  xrayMode?: boolean;
}

export function PortMarkerItem({ port, isDanger, xrayMode }: PortMarkerItemProps) {
  const cfg = getLeaderLineConfig(port.id);
  const strokeClass = isDanger ? styles.strokeDanger : styles.strokeNormal;

  return (
    <div className={styles.container}>
      <BioOpticReticle isDanger={isDanger} xrayMode={xrayMode} />
      <svg className={styles.leaderSvg} viewBox="-100 -100 200 200">
        <path d={cfg.path} className={`${styles.leaderPath} ${strokeClass}`} />
        <circle cx={cfg.endX} cy={cfg.endY} r="2" className={`${styles.leaderDot} ${strokeClass}`} />
      </svg>
      <div className={styles.calloutWrapper} style={cfg.calloutStyle}>
        <TelemetryCallout port={port} isDanger={isDanger} xrayMode={xrayMode} />
      </div>
    </div>
  );
}
