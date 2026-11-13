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

  if (isExecuted) {
    return (
      <div className={styles.executedBanner}>
        <div className={styles.left}>
          <div className={styles.successIconWrap}>
            <CheckCircle2 size={16} />
          </div>
          <div className={styles.info}>
            <span className={styles.title}>SMART SLOT-SWAP АКТИВИРОВАН // CASPER TESTNET</span>
            <span className={styles.sub}>Слот обменян с AZE-BAK-8104 · Демередж захеджирован (0 ₽ штрафов)</span>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onOpen} className={styles.triggerBtn}>
          Детали обмена
        </Button>
      </div>
    );
  }

  if (isHighRisk) {
    return (
      <div className={styles.banner}>
        <div className={styles.left}>
          <div className={styles.iconWrap}>
            <ShieldAlert size={16} />
          </div>
          <div className={styles.info}>
            <span className={styles.title}>УГРОЗА ДЕМЕРЕДЖА: 2 178 000 ₽ / СУТ</span>
            <span className={styles.sub}>Срыв cutoff 84% · Доступен встречный обмен слотом в Махачкале</span>
          </div>
        </div>
        <Button size="sm" variant="default" onClick={onOpen} className={styles.triggerBtn}>
          <Zap size={14} />
          <span>Выполнить Smart Slot-Swap</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.standbyBanner}>
      <div className={styles.left}>
        <div className={styles.standbyIconWrap}>
          <Zap size={16} />
        </div>
        <div className={styles.info}>
          <span className={styles.title}>БИРЖА ПАРОМНЫХ СЛОТОВ // CASPER SMART ESCROW</span>
          <span className={styles.sub}>P2P-хеджирование рисков простоя судов и срыва паромного cutoff</span>
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={onOpen} className={styles.triggerBtn}>
        <Zap size={13} />
        <span>Открыть биржу слотов</span>
      </Button>
    </div>
  );
}
