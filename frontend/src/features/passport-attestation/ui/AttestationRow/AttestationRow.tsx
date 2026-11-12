'use client';

import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getRoleLabel } from '@/entities/shipment';
import type { Attestation, Role } from '@/shared/api/caspian';
import { Badge } from '@/shared/ui';
import styles from './AttestationRow.module.css';

interface AttestationRowProps {
  role: Role;
  currentRole: Role;
  version: number;
  attestations: Attestation[];
}

export function AttestationRow({ role, currentRole, version, attestations }: AttestationRowProps) {
  const current = attestations.find((a) => a.role === role && a.version === version && a.status === 'active');
  const latest = current ?? attestations.filter((a) => a.role === role).at(-1);
  const statusLabel = current
    ? current.decision === 'approved'
      ? 'Подтверждено'
      : 'Отклонено'
    : latest?.status === 'invalidated'
      ? 'Сброшено'
      : latest?.status === 'expired'
        ? 'Истекло'
        : 'Ожидает';
  const variant = current
    ? current.decision === 'approved'
      ? 'success'
      : 'destructive'
    : 'warning';

  return (
    <div className={`${styles.row} ${role === currentRole ? styles.activeRole : ''}`}>
      <span className={styles.roleWrap}>
        {current?.decision === 'approved' ? (
          <CheckCircle2 className={styles.okIcon} />
        ) : current?.decision === 'rejected' ? (
          <XCircle className={styles.badIcon} />
        ) : (
          <Clock className={styles.waitIcon} />
        )}
        <span>{getRoleLabel(role)}</span>
      </span>
      <Badge variant={variant}>{statusLabel}</Badge>
    </div>
  );
}
