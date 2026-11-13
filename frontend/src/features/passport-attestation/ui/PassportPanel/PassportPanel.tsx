'use client';

import { ExternalLink, ShieldCheck } from 'lucide-react';
import { API_BASE_URL, getPassportStatusLabel } from '@/entities/shipment';
import { createCaspianClient, type Role, type Shipment } from '@/shared/api/caspian';
import { Badge, Separator, ViewfinderFrame } from '@/shared/ui';
import { AttestationRow } from '../AttestationRow';
import { DocumentList } from '../DocumentList';
import { PassportActions } from '../PassportActions';
import { PassportHashes } from '../PassportHashes';
import { PassportChainCheck } from '../PassportChainCheck';
import { PassportHistory } from '../PassportHistory';
import styles from './PassportPanel.module.css';

interface PassportPanelProps {
  shipment: Shipment;
  role: Role;
  isBusy: boolean;
  onAttest: (decision: 'approved' | 'rejected') => void;
  onRevoke?: () => void;
  onVerifyEcmr?: () => void;
  onReplaceDocument: (docId: string, filename: string, contentBase64: string) => void;
}

export function PassportPanel({
  shipment,
  role,
  isBusy,
  onAttest,
  onRevoke,
  onVerifyEcmr,
  onReplaceDocument,
}: PassportPanelProps) {
  const { passport, documents, allowed_actions } = shipment;
  const client = createCaspianClient(API_BASE_URL, () => role);
  const canRevoke = allowed_actions.includes('revoke') && !isBusy;
  const canAttest = allowed_actions.includes('attest') && !isBusy;
  const canReplace = allowed_actions.includes('replace_document') && !isBusy;
  const variant = passport.status === 'ready' ? 'success' : passport.status === 'blocked' ? 'destructive' : 'secondary';

  return (
    <ViewfinderFrame stamp="Pre-clearance" className={styles.card}>
      <div className={styles.titleRow}>
        <span className={styles.titleWrap}>
          <ShieldCheck className={styles.icon} />
          <span className={styles.title}>Паспорт v{passport.version}</span>
        </span>
        <Badge variant={variant} className={styles.collageBadge}>{getPassportStatusLabel(passport.status)}</Badge>
      </div>
      <div className={styles.subRow}>
        <span>{passport.network === 'mock' ? 'Симуляция согласования' : 'Casper Testnet'}</span>
        {passport.explorer_url && <a href={passport.explorer_url} target="_blank" rel="noreferrer" className={styles.link}>Explorer <ExternalLink className={styles.miniIcon} /></a>}
      </div>
      <p>Третья роль — имитатор таможенного сервиса. Согласование комплекта не означает таможенный выпуск.</p>
      <div className={styles.content}>
        <PassportHashes passport={passport} documents={documents} />
        <div className={styles.rows}>
          {passport.required_roles.map((r) => <AttestationRow key={r} role={r} currentRole={role} version={passport.version} attestations={passport.attestations} />)}
        </div>
        <PassportActions key={`${role}-${passport.version}`} passport={passport} canRevoke={canRevoke} onRevoke={onRevoke} role={role} canAttest={canAttest} isBusy={isBusy} onAttest={onAttest} onVerifyEcmr={onVerifyEcmr} />
        <Separator />
        <DocumentList onDownload={passport.network === 'casper-test' ? (doc) => client.downloadDocument(shipment.id, doc.id, doc.version) : undefined} documents={documents} canReplace={canReplace} isBusy={isBusy} onReplaceDocument={onReplaceDocument} />
      </div>
      {passport.network === 'casper-test' && <>
        <PassportChainCheck shipment={shipment} role={role} />
        <PassportHistory key={`${shipment.id}-${passport.version}`} shipment={shipment} role={role} />
      </>}
    </ViewfinderFrame>
  );
}
