'use client';

import { FileText, Upload } from 'lucide-react';
import type { Document } from '@/shared/api/caspian';
import { readFileAsBase64 } from '@/shared/lib/formatters';
import styles from './DocumentList.module.css';

interface DocumentListProps {
  documents: Document[];
  canReplace: boolean;
  isBusy: boolean;
  onReplaceDocument: (documentId: string, filename: string, contentBase64: string) => void;
}

export function DocumentList({
  documents,
  canReplace,
  isBusy,
  onReplaceDocument,
}: DocumentListProps) {
  const handleFileChange = async (docId: string, file: File | undefined) => {
    if (!file || file.size > 1_048_576) return;
    const base64 = await readFileAsBase64(file);
    onReplaceDocument(docId, file.name, base64);
  };

  return (
    <div className={styles.list}>
      {documents.map((doc) => (
        <div key={doc.id} className={styles.docRow}>
          <div className={styles.docInfo}>
            <FileText className={styles.docIcon} />
            <div className={styles.meta}>
              <span className={styles.name}>{doc.filename} (v{doc.version})</span>
              <span className={styles.hash}>SHA-256: {doc.sha256.slice(0, 12)}…</span>
            </div>
          </div>
          {canReplace && !isBusy && (
            <label className={styles.uploadLabel} title="Заменить файл (до 1 MiB)">
              <Upload className={styles.uploadIcon} />
              <input
                type="file"
                className={styles.fileInput}
                onChange={(e) => void handleFileChange(doc.id, e.target.files?.[0])}
              />
            </label>
          )}
        </div>
      ))}
    </div>
  );
}
