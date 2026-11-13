'use client';

import { ArrowLeftRight } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import type { SwapCandidate } from '../../model/types';
import { SwapCargoCard } from '../SwapCargoCard';
import { SwapDraughtCheck } from '../SwapDraughtCheck';
import styles from './SlotSwapComparison.module.css';

interface SlotSwapComparisonProps {
  shipment: Shipment;
  candidate: SwapCandidate;
}

export function SlotSwapComparison({ shipment, candidate }: SlotSwapComparisonProps) {
  return (
    <div className={styles.container}>
      <div className={styles.cardsGrid}>
        <SwapCargoCard
          isDelayed
          lotId={shipment.id}
          badgeText="Опаздывает (84%)"
          badgeVariant="destructive"
          company="Ваша партия · В пути"
          massTonnes={shipment.mass_tonnes}
          location={shipment.current_location.name}
          thirdLabel="Угроза cutoff"
          thirdValue="+18 ч задержки"
          isThirdDanger
          fourthLabel="Демередж"
          fourthValue="2 178 000 ₽ / сут"
          isFourthDanger
        />

        <div className={styles.swapArrowWrap}>
          <div className={styles.swapArrow}>
            <ArrowLeftRight size={15} />
          </div>
        </div>

        <SwapCargoCard
          lotId={candidate.lotName}
          badgeText="Готов на терминале"
          badgeVariant="success"
          company={candidate.partnerCompany}
          massTonnes={candidate.massTonnes}
          location={candidate.currentPort}
          thirdLabel="Готовность P90"
          thirdValue="100% готов"
          fourthLabel="Рейс ASCO"
          fourthValue="Через 72 часа"
        />
      </div>

      <SwapDraughtCheck
        shipDraughtM={candidate.shipDraughtM}
        ukcSafeMarginM={candidate.ukcSafeMarginM}
      />
    </div>
  );
}
