'use client';

import { X } from 'lucide-react';
import { PassportPanel } from '@/features/passport-attestation';
import type { Role, Shipment } from '@/shared/api/caspian';
import styles from './CustomsOverlay.module.css';

interface CustomsOverlayProps {
  shipment: Shipment;
  role: Role;
  isBusy: boolean;
  isOpen: boolean;
  onAttest: (decision: 'approved' | 'rejected') => void;
  onVerifyEcmr?: () => void;
  onReplaceDocument: (docId: string, filename: string, contentBase64: string) => void;
  onClose?: () => void;
}

export function CustomsOverlay({
  shipment,
  role,
  isBusy,
  isOpen,
  onAttest,
  onVerifyEcmr,
  onReplaceDocument,
  onClose,
}: CustomsOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      {onClose && (
        <div className={styles.header}>
          <span className={styles.tag}>[ 02-CUSTOMS / PRE-CLEARANCE ]</span>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X className={styles.closeIcon} />
          </button>
        </div>
      )}
      <PassportPanel
        shipment={shipment}
        role={role}
        isBusy={isBusy}
        onAttest={onAttest}
        onVerifyEcmr={onVerifyEcmr}
        onReplaceDocument={onReplaceDocument}
      />
    </div>
  );
}
