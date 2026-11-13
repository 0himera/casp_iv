'use client';

import { CheckCircle2, ExternalLink } from 'lucide-react';
import type { SwapCandidate } from '../../model/types';
import styles from './SlotSwapSuccess.module.css';

interface SlotSwapSuccessProps {
  candidate: SwapCandidate;
}

export function SlotSwapSuccess({ candidate }: SlotSwapSuccessProps) {
  return (
    <div className={styles.container}>
      <div className={styles.iconCircle}>
        <CheckCircle2 size={30} />
      </div>

      <div>
        <h3 className={styles.heading}>Сделка подтверждена в Casper Testnet</h3>
        <p className={styles.sub}>
          Атомарный обмен слотами выполнен успешно. Судно «Композитор Караев» примет готовую партию {candidate.lotName}. Ваш груз перебронирован на следующий рейс без штрафов.
        </p>
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metricBox}>
          <span className={styles.mLabel}>СЭКОНОМЛЕНО</span>
          <span className={styles.mVal}>$22 500</span>
        </div>
        <div className={styles.metricBox}>
          <span className={styles.mLabel}>ПРОСТОЙ СУДНА</span>
          <span className={styles.mVal}>0 ЧАСОВ</span>
        </div>
        <div className={styles.metricBox}>
          <span className={styles.mLabel}>НОВЫЙ СЛОТ</span>
          <span className={styles.mVal}>ЧЕРЕЗ 48Ч</span>
        </div>
      </div>

      <div className={styles.receipt}>
        <div className={styles.hashRow}>
          <span>Deploy Hash (Casper):</span>
          <span className={styles.hash}>{candidate.casperDeployHash.slice(0, 24)}… <ExternalLink size={10} /></span>
        </div>
        <div className={styles.hashRow}>
          <span>Блок консенсуса:</span>
          <span>#2,841,920 · 3/3 signatures confirmed</span>
        </div>
      </div>
    </div>
  );
}

