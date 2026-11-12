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
  const isApproved = current?.decision === 'approved';
  const isRejected = current?.decision === 'rejected';
  const isInvalidated = latest?.status === 'invalidated';

  const statusLabel = role === 'customs'
    ? isApproved ? 'e-CMR верифицирован' : isInvalidated ? 'Повторная подпись' : 'Ожидает e-CMR'
    : isApproved ? 'Согласовано' : isRejected ? 'Отклонено' : isInvalidated ? 'Повторная подпись' : 'Ожидает подписи';

  const variant = isApproved ? 'success' : isRejected ? 'destructive' : isInvalidated ? 'warning' : 'outline';

  return (
    <div className={`${styles.row} ${role === currentRole ? styles.activeRole : ''}`}>
      <span className={styles.roleWrap}>
        {isApproved ? (
          <CheckCircle2 className={styles.okIcon} />
        ) : isRejected ? (
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
