'use client';

import { PassportPanel } from '@/features/passport-attestation';
import type { Role, Shipment } from '@/shared/api/caspian';
import styles from './CustomsOverlay.module.css';

interface CustomsOverlayProps {
  shipment: Shipment;
  role: Role;
  isBusy: boolean;
  isOpen: boolean;
  onAttest: (decision: 'approved' | 'rejected') => void;
  onReplaceDocument: (docId: string, filename: string, contentBase64: string) => void;
}

export function CustomsOverlay({
  shipment,
  role,
  isBusy,
  isOpen,
  onAttest,
  onReplaceDocument,
}: CustomsOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <PassportPanel
        shipment={shipment}
        role={role}
        isBusy={isBusy}
        onAttest={onAttest}
        onReplaceDocument={onReplaceDocument}
      />
    </div>
  );
}
