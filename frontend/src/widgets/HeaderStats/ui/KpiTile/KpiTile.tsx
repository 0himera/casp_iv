'use client';

import type { ReactNode } from 'react';
import styles from './KpiTile.module.css';

interface KpiTileProps {
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  icon: ReactNode;
}

export function KpiTile({
  label,
  value,
  tone = 'default',
  icon,
}: KpiTileProps) {
  return (
    <div className={styles.tile}>
      <span className={styles.divider} aria-hidden="true" />
      <div className={styles.inner}>
        <span className={styles.labelRow}>
          <span className={styles.iconWrap}>{icon}</span>
          <span className={styles.label}>{label}</span>
        </span>
        <span className={`${styles.value} ${styles[tone]}`}>{value}</span>
      </div>
    </div>
  );
}
