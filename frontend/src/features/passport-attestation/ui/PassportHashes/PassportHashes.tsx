'use client';

import type { Document, Shipment } from '@/shared/api/caspian';
import styles from './PassportHashes.module.css';

interface PassportHashesProps {
  passport: Shipment['passport'];
  documents: Document[];
}

export function PassportHashes({ passport, documents }: PassportHashesProps) {
  const ecmrDoc = documents.find((d) => d.kind === 'cmr' || d.id === 'doc_ecmr');
  const ecmrHash = ecmrDoc?.sha256 ? `${ecmrDoc.sha256.slice(0, 10)}…` : '4f9d8a21…';

  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <span><strong className={styles.tag}>e-CMR:</strong> {ecmrHash}</span>
        <span><strong className={styles.tag}>Route:</strong> {passport.route_hash.slice(0, 10)}…</span>
      </div>
      <div className={styles.row}>
        <span><strong className={styles.tag}>Docs:</strong> {passport.documents_hash.slice(0, 10)}…</span>
        <span>v{passport.version}</span>
      </div>
    </div>
  );
}
