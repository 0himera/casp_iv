'use client';

import { ExternalLink, ShieldCheck } from 'lucide-react';
import { getPassportStatusLabel, getRoleLabel } from '@/entities/shipment';
import type { Role, Shipment } from '@/shared/api/caspian';
import { Badge, Button, PixelMarker, Separator, ViewfinderFrame } from '@/shared/ui';
import { AttestationRow } from '../AttestationRow';
import { DocumentList } from '../DocumentList';
import styles from './PassportPanel.module.css';

interface PassportPanelProps {
  shipment: Shipment;
  role: Role;
  isBusy: boolean;
  onAttest: (decision: 'approved' | 'rejected') => void;
  onReplaceDocument: (docId: string, filename: string, contentBase64: string) => void;
}

export function PassportPanel({ shipment, role, isBusy, onAttest, onReplaceDocument }: PassportPanelProps) {
  const { passport, documents, allowed_actions } = shipment;
  const canAttest = allowed_actions.includes('attest') && !isBusy;
  const canReplace = allowed_actions.includes('replace_document') && !isBusy;
  const variant = passport.status === 'ready' ? 'success' : passport.status === 'blocked' ? 'destructive' : 'warning';

  return (
    <ViewfinderFrame stamp="Pre-clearance" className={styles.card}>
      <div className={styles.titleRow}>
        <span className={styles.titleWrap}>
          <PixelMarker variant={passport.status === 'ready' ? 'verified' : 'telemetry'} />
          <ShieldCheck className={styles.icon} />
          <span className={styles.title}>Паспорт v{passport.version}</span>
        </span>
        <Badge variant={variant} className={styles.collageBadge}>
          {getPassportStatusLabel(passport.status)}
        </Badge>
      </div>
      <div className={styles.subRow}>
        <span>{passport.network === 'mock' ? 'Симуляция согласования' : 'Casper Testnet'}</span>
        {passport.explorer_url && <a href={passport.explorer_url} target="_blank" rel="noreferrer" className={styles.link}>Explorer <ExternalLink className={styles.miniIcon} /></a>}
      </div>
      <div className={styles.content}>
        <div className={styles.hashes}><span>Docs: {passport.documents_hash.slice(0, 10)}…</span><span>Route: {passport.route_hash.slice(0, 10)}…</span></div>
        <div className={styles.rows}>
          {passport.required_roles.map((r) => <AttestationRow key={r} role={r} currentRole={role} version={passport.version} attestations={passport.attestations} />)}
        </div>
        <div className={styles.actions}>
          <Button type="button" size="sm" disabled={!canAttest} onClick={() => onAttest('approved')} className={styles.actionBtn}>
            Подтвердить ({getRoleLabel(role)})
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={!canAttest} onClick={() => onAttest('rejected')}>Отклонить</Button>
        </div>
        <Separator />
        <DocumentList documents={documents} canReplace={canReplace} isBusy={isBusy} onReplaceDocument={onReplaceDocument} />
      </div>
    </ViewfinderFrame>
  );
}
