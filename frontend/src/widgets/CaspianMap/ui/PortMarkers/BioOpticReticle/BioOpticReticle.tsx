'use client';

import styles from './BioOpticReticle.module.css';

interface BioOpticReticleProps {
  isDanger?: boolean;
  xrayMode?: boolean;
}

export function BioOpticReticle({ isDanger, xrayMode }: BioOpticReticleProps) {
  const modeClass = isDanger ? styles.danger : xrayMode ? styles.xray : styles.normal;

  return (
    <div className={`${styles.wrapper} ${modeClass}`}>
      <svg className={styles.reticleSvg} viewBox="-28 -28 56 56">
        <circle cx="0" cy="0" r="12" className={styles.orbitInner} />
        <circle cx="0" cy="0" r="22" className={styles.orbitOuter} />
        <line x1="0" y1="-26" x2="0" y2="-20" className={styles.tick} />
        <line x1="0" y1="20" x2="0" y2="26" className={styles.tick} />
        <line x1="-26" y1="0" x2="-20" y2="0" className={styles.tick} />
        <line x1="20" y1="0" x2="26" y2="0" className={styles.tick} />
        <line x1="-5" y1="0" x2="5" y2="0" className={styles.crosshair} />
        <line x1="0" y1="-5" x2="0" y2="5" className={styles.crosshair} />
        <circle cx="0" cy="0" r="1.5" className={styles.centerDot} />
      </svg>
    </div>
  );
}
