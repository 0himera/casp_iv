'use client';

import { ArrowLeftRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { Badge } from '@/shared/ui';
import type { SwapCandidate } from '../../model/types';
import styles from './SlotSwapComparison.module.css';

interface SlotSwapComparisonProps {
  shipment: Shipment;
  candidate: SwapCandidate;
}

export function SlotSwapComparison({ shipment, candidate }: SlotSwapComparisonProps) {
  return (
    <div className={styles.container}>
      <div className={styles.cardsGrid}>
        <div className={`${styles.cargoCard} ${styles.delayedCard}`}>
          <div className={styles.header}>
            <span className={styles.lotName}>{shipment.id}</span>
            <Badge variant="destructive">Опаздывает (84%)</Badge>
          </div>
          <span className={styles.company}>Ваша партия · В пути к порту</span>
          <div className={styles.rows}>
            <div className={styles.row}><span>Вес партии:</span><span className={styles.val}>{shipment.mass_tonnes} т</span></div>
            <div className={styles.row}><span>Локация:</span><span className={styles.val}>{shipment.current_location.name}</span></div>
            <div className={styles.row}><span>Угроза cutoff:</span><span className={styles.danger}>+18 ч задержки</span></div>
            <div className={styles.row}><span>Демередж судна:</span><span className={styles.danger}>$22 500 / сут</span></div>
          </div>
        </div>

        <div className={styles.swapArrow}>
          <ArrowLeftRight size={16} />
        </div>

        <div className={`${styles.cargoCard} ${styles.readyCard}`}>
          <div className={styles.header}>
            <span className={styles.lotName}>{candidate.lotName}</span>
            <Badge variant="success">Готов на терминале</Badge>
          </div>
          <span className={styles.company}>{candidate.partnerCompany}</span>
          <div className={styles.rows}>
            <div className={styles.row}><span>Вес партии:</span><span className={styles.val}>{candidate.massTonnes} т</span></div>
            <div className={styles.row}><span>Локация:</span><span className={styles.val}>{candidate.currentPort}</span></div>
            <div className={styles.row}><span>Готовность P90:</span><span className={styles.ok}>100% на причале</span></div>
            <div className={styles.row}><span>Исходный рейс:</span><span className={styles.val}>Через 72 часа</span></div>
          </div>
        </div>
      </div>

      <div className={styles.draughtCheck}>
        <span className={styles.checkTitle}>
          <ShieldCheck size={14} />
          <span>Гидрологическая совместимость (Draught / UKC):</span>
        </span>
        <span>Осадка {candidate.shipDraughtM} м · Запас UKC +{candidate.ukcSafeMarginM} м · <strong>СОВМЕСТИМ</strong></span>
      </div>
    </div>
  );
}
