'use client';

import { Coins } from 'lucide-react';
import { Badge } from '@/shared/ui';
import styles from './SlotSwapEscrow.module.css';

interface SlotSwapEscrowProps {
  demurrageRub: number;
}

export function SlotSwapEscrow({ demurrageRub }: SlotSwapEscrowProps) {
  const formattedRub = demurrageRub.toLocaleString('ru-RU');

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <span className={styles.title}>
          <Coins size={14} />
          <span>Смарт-эскроу демереджа // Casper Odra Contract</span>
        </span>
        <Badge variant="success">P2P Escrow Protection</Badge>
      </div>

      <div className={styles.grid}>
        <div className={styles.box}>
          <span className={styles.label}>ДЕПОЗИТ ДЕМЕРЕДЖА</span>
          <span className={styles.val}>{formattedRub} ₽</span>
        </div>
        <div className={styles.box}>
          <span className={styles.label}>ЗАЛОГ В СМАРТ-КОНТРАКТЕ</span>
          <span className={styles.val}>{formattedRub} ₽</span>
        </div>
        <div className={styles.box}>
          <span className={styles.label}>ШТРАФ ДЛЯ ВАС</span>
          <span className={`${styles.val} ${styles.okVal}`}>0 ₽ (ЗАХЕДЖИРОВАНО)</span>
        </div>
      </div>

      <div className={styles.contractInfo}>
        <span className={styles.contractMethod}>TransitPassport::execute_atomic_swap()</span>
        <span>Консенсус 3/3 (Логист А + Логист Б + ASCO)</span>
      </div>
    </div>
  );
}
