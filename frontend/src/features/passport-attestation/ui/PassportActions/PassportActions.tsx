'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { getRoleLabel } from '@/entities/shipment';
import type { Role, Shipment } from '@/shared/api/caspian';
import { Button } from '@/shared/ui';
import styles from './PassportActions.module.css';

interface PassportActionsProps {
  passport: Shipment['passport']; role: Role; canAttest: boolean; isBusy: boolean;
  onAttest: (decision: 'approved' | 'rejected') => void;
  onVerifyEcmr?: () => void;
  onRevoke?: () => void;
  canRevoke?: boolean;
}
export function PassportActions({ passport, role, canAttest, isBusy, onAttest, canRevoke, onRevoke }: PassportActionsProps) {
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const decided = passport.attestations.some((a) => a.role === role && a.version === passport.version);
  return <div className={styles.actions}>
    {passport.status === 'ready' && <div className={styles.readyBanner}>
      <span className={styles.greenLight} /><span>Комплект согласован · {passport.network === 'mock' ? 'симуляция' : 'Casper testnet'}</span>
    </div>}
    {decided && <p>Решение роли для этой версии уже записано. Для нового решения нужна новая версия.</p>}
    {!decided && <div className={styles.buttonRow}>
      <Button type="button" size="sm" disabled={!canAttest} onClick={() => onAttest('approved')} className={styles.primaryBtn}>
        {isBusy ? <Loader2 size={13} className={styles.spinIcon} /> : <CheckCircle2 size={13} />}
        <span>{isBusy ? 'Ожидание подтверждения…' : `Заверить манифест · ${getRoleLabel(role)}`}</span>
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={!canAttest} onClick={() => onAttest('rejected')} className={styles.rejectBtn}><X size={13} /><span>Отклонить</span></Button>
    </div>}
    {onRevoke && canRevoke && <div className={styles.revocation}>
      {confirmRevoke ? <>
        <p>Отозвать согласование роли «{getRoleLabel(role)}» для v{passport.version}? Повторно подписать эту версию нельзя. Для нового решения потребуется новая версия паспорта.</p>
        <div className={styles.buttonRow}><Button size="sm" variant="destructive" disabled={isBusy} onClick={() => { setConfirmRevoke(false); onRevoke(); }}>Подтвердить отзыв</Button><Button size="sm" variant="ghost" onClick={() => setConfirmRevoke(false)}>Отмена</Button></div>
      </> : <Button size="sm" variant="outline" onClick={() => setConfirmRevoke(true)}>Отозвать своё согласование</Button>}
    </div>}
  </div>;
}
