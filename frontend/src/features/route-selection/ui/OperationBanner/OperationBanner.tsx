'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import type { Operation } from '@/shared/api/caspian';
import { Button } from '@/shared/ui';
import styles from './OperationBanner.module.css';

interface OperationBannerProps {
  activeOperation: Operation | null;
  operationTimedOut: boolean;
  errorBanner: string | null;
  onRecheckOperation: () => void;
}

export function OperationBanner({
  activeOperation,
  operationTimedOut,
  errorBanner,
  onRecheckOperation,
}: OperationBannerProps) {
  return (
    <>
      {errorBanner && <div className={styles.errorBox}>{errorBanner}</div>}
      {activeOperation && (
        <div className={styles.opBox}>
          <Loader2 className={styles.spinIcon} />
          <span>
            {operationTimedOut
              ? 'Проверяем выполнение'
              : `Операция (${activeOperation.status})`}
          </span>
          {operationTimedOut && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onRecheckOperation}
            >
              <RefreshCw className={styles.miniIcon} /> Повторить
            </Button>
          )}
        </div>
      )}
    </>
  );
}
