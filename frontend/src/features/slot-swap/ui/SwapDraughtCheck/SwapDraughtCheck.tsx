'use client';

import { ShieldCheck } from 'lucide-react';
import styles from './SwapDraughtCheck.module.css';

interface SwapDraughtCheckProps {
  shipDraughtM: number;
  ukcSafeMarginM: number;
}

export function SwapDraughtCheck({ shipDraughtM, ukcSafeMarginM }: SwapDraughtCheckProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <ShieldCheck size={14} />
          <span>Гидрологическая совместимость (Draught / UKC)</span>
        </div>
        <span className={styles.badge}>СОВМЕСТИМ</span>
      </div>
      <div className={styles.metrics}>
        <span>Осадка судна: <strong>{shipDraughtM} м</strong></span>
        <span>·</span>
        <span>Запас UKC: <strong>+{ukcSafeMarginM} м</strong></span>
        <span>·</span>
        <span>Канал: <strong>Безопасная глубина (ВКМСК)</strong></span>
      </div>
    </div>
  );
}

