'use client';

import { CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import { Button } from '@/shared/ui';
import styles from './SlotSwapTrigger.module.css';

interface SlotSwapTriggerProps {
  missProbability: number | null;
  isExecuted: boolean;
  onOpen: () => void;
}

export function SlotSwapTrigger({ missProbability, isExecuted, onOpen }: SlotSwapTriggerProps) {
  const isHighRisk = (missProbability ?? 0) >= 0.5;

  if (!isHighRisk && !isExecuted) return null;

  if (isExecuted) {
    return (
      <div className={styles.executedBanner}>
        <div className={styles.left}>
          <div className={styles.successIconWrap}>
            <CheckCircle2 size={16} />
          </div>
          <div className={styles.info}>
            <span className={styles.title}>SMART SLOT-SWAP АКТИВИРОВАН // CASPER TESTNET</span>
            <span className={styles.sub}>Слот обменян с AZE-BAK-8104 · Демередж захеджирован ($0 штрафов)</span>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onOpen} className={styles.triggerBtn}>
          Детали обмена
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.banner}>
      <div className={styles.left}>
        <div className={styles.iconWrap}>
          <ShieldAlert size={16} />
        </div>
        <div className={styles.info}>
          <span className={styles.title}>УГРОЗА ДЕМЕРЕДЖА: $22 500 (2 180 000 ₽)</span>
          <span className={styles.sub}>Доступен встречный груз в Махачкале для P2P-обмена слотом</span>
        </div>
      </div>
      <Button size="sm" variant="default" onClick={onOpen} className={styles.triggerBtn}>
        <Zap size={14} />
        <span>Выполнить Smart Slot-Swap</span>
      </Button>
    </div>
  );
}
