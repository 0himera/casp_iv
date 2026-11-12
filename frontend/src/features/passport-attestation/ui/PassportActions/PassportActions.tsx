'use client';

import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { getRoleLabel } from '@/entities/shipment';
import type { Role, Shipment } from '@/shared/api/caspian';
import { Button } from '@/shared/ui';
import styles from './PassportActions.module.css';

interface PassportActionsProps {
  passport: Shipment['passport'];
  role: Role;
  canAttest: boolean;
  isBusy: boolean;
  onAttest: (decision: 'approved' | 'rejected') => void;
  onVerifyEcmr?: () => void;
}

export function PassportActions({
  passport,
  role,
  canAttest,
  isBusy,
  onAttest,
  onVerifyEcmr,
}: PassportActionsProps) {
  const isReady = passport.status === 'ready';

  return (
    <div className={styles.actions}>
      {isReady ? (
        <div className={styles.readyBanner}>
          <span className={styles.greenLight} />
          <span>Комплект согласован · Casper testnet</span>
        </div>
      ) : (
        onVerifyEcmr && (
          <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={onVerifyEcmr} className={styles.verifyBtn}>
            <ShieldCheck size={13} className={styles.mutedIcon} />
            <span>Верифицировать e-CMR (Consensus)</span>
          </Button>
        )
      )}
      <div className={styles.buttonRow}>
        <Button type="button" size="sm" variant="default" disabled={!canAttest} onClick={() => onAttest('approved')} className={styles.primaryBtn}>
          <CheckCircle2 size={13} />
          <span>Заверить манифест · {getRoleLabel(role)}</span>
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={!canAttest} onClick={() => onAttest('rejected')} className={styles.rejectBtn}>
          <X size={13} />
          <span>Отклонить</span>
        </Button>
      </div>
    </div>
  );
}
