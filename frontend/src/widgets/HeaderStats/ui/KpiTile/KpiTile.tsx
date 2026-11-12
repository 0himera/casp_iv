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
      <span className={styles.iconWrap}>{icon}</span>
      <div className={styles.meta}>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.value} ${styles[tone]}`}>{value}</span>
      </div>
    </div>
  );
}

