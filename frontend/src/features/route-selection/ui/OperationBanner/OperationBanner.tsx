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
  const labels = { queued: 'Ожидает отправки', submitted: 'Транзакция отправлена', confirmed: 'Подтверждено Casper', failed: 'Операция отклонена' };
  return (
    <>
      {errorBanner && <div className={styles.errorBox}>{errorBanner}</div>}
      {activeOperation && (
        <div className={styles.opBox}>
          <Loader2 className={styles.spinIcon} />
          <span>
            {operationTimedOut
              ? 'Проверяем выполнение'
              : labels[activeOperation.status]}
          </span>
          {activeOperation.explorer_url && <a href={activeOperation.explorer_url} target="_blank" rel="noreferrer">Транзакция ↗</a>}
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
