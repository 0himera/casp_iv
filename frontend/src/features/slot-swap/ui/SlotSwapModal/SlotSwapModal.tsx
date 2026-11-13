'use client';

import { Loader2, X, Zap } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { Button } from '@/shared/ui';
import type { SwapCandidate, SwapStep } from '../../model/types';
import { SlotSwapComparison } from '../SlotSwapComparison';
import { SlotSwapEscrow } from '../SlotSwapEscrow';
import { SlotSwapSuccess } from '../SlotSwapSuccess';
import styles from './SlotSwapModal.module.css';

interface SlotSwapModalProps {
  isOpen: boolean;
  step: SwapStep;
  shipment: Shipment;
  candidate: SwapCandidate;
  onClose: () => void;
  onExecute: () => void;
}

export function SlotSwapModal({
  isOpen, step, shipment, candidate, onClose, onExecute,
}: SlotSwapModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <span className={styles.stamp}>[ PROTOCOL // ATOMIC SLOT-SWAP & DEMURRAGE ESCROW ]</span>
            <h2 className={styles.heading}>Биржа паромных слотов и смарт-эскроу</h2>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>
          {step === 'executing' ? (
            <div className={styles.executingWrap}>
              <Loader2 className={styles.spinIcon} />
              <span>Регистрация атомарного свопа в смарт-контракте Casper Testnet...</span>
            </div>
          ) : step === 'confirmed' ? (
            <SlotSwapSuccess candidate={candidate} />
          ) : (
            <>
              <SlotSwapComparison shipment={shipment} candidate={candidate} />
              <SlotSwapEscrow demurrageRub={candidate.demurrageHedgedRub} />
            </>
          )}
        </div>

        <div className={styles.footer}>
          {step === 'confirmed' ? (
            <Button size="sm" variant="default" onClick={onClose}>
              Применить к цифровому двойнику
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={onClose} disabled={step === 'executing'}>
                Отмена
              </Button>
              <Button size="sm" variant="default" onClick={onExecute} disabled={step === 'executing'}>
                <Zap size={13} />
                <span>Подписать и провести Swap в Casper Testnet</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

