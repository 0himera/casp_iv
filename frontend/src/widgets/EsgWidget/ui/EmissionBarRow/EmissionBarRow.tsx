'use client';

import { Progress } from '@/shared/ui';
import styles from './EmissionBarRow.module.css';

interface EmissionBarRowProps {
  label: string;
  kg: number;
  maxKg: number;
  toneClass?: string;
}

export function EmissionBarRow({
  label,
  kg,
  maxKg,
  toneClass,
}: EmissionBarRowProps) {
  const percent = Math.min(100, Math.round((kg / maxKg) * 100));
  return (
    <div className={styles.row}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{kg.toLocaleString('ru-RU')} кг</span>
      </div>
      <Progress value={percent} indicatorClassName={toneClass} className={styles.bar} />
    </div>
  );
}

