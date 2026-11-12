'use client';

import { Timer } from 'lucide-react';
import styles from './ContractMetaGrid.module.css';

interface ContractMetaGridProps {
  hash: string;
  accelerationHours: number;
}

export function ContractMetaGrid({ hash, accelerationHours }: ContractMetaGridProps) {
  return (
    <div className={styles.metaGrid}>
      <div className={styles.metaBox}>
        <span className={styles.metaLabel}>Смарт-контракт</span>
        <span className={styles.hashValue}>{hash}</span>
      </div>
      <div className={styles.metaBox}>
        <span className={styles.metaLabel}>Ускорение</span>
        <span className={styles.timerValue}>
          <Timer className={styles.miniIcon} />-{accelerationHours} ч
        </span>
      </div>
    </div>
  );
}

