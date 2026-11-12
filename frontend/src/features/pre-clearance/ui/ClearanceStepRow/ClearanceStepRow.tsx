'use client';

import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import type { SmartContractStep } from '@/entities/cargo';
import styles from './ClearanceStepRow.module.css';

interface ClearanceStepRowProps {
  step: SmartContractStep;
}

export function ClearanceStepRow({ step }: ClearanceStepRowProps) {
  return (
    <div className={styles.stepRow}>
      <span className={styles.authority}>{step.authority}</span>
      <span className={styles.statusWrap}>
        {step.status === 'cleared' && (
          <CheckCircle2 className={styles.clearedIcon} />
        )}
        {step.status === 'verifying' && (
          <Loader2 className={styles.verifyingIcon} />
        )}
        {step.status === 'pending' && <Clock className={styles.pendingIcon} />}
        <span className={styles[step.status]}>
          {step.status === 'cleared'
            ? 'Verified'
            : step.status === 'verifying'
              ? 'Проверка...'
              : 'Ожидает'}
        </span>
      </span>
    </div>
  );
}

