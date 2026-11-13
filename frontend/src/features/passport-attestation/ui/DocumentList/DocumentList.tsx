'use client';

import { useState } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const handleFileChange = async (docId: string, file: File | undefined) => {
    if (!file) return;
    if (file.size > 1_048_576) { setError('Файл больше 1 MiB. Выберите файл меньшего размера.'); return; }
    setError(null);
    try {
      const base64 = await readFileAsBase64(file);
      onReplaceDocument(docId, file.name, base64);
    } catch { setError('Не удалось прочитать файл. Попробуйте выбрать его снова.'); }
  };

  return (
    <div className={styles.list}>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {documents.map((doc) => (
        <div key={doc.id} className={styles.docRow}>
          <div className={styles.docInfo}>
            <FileText className={styles.docIcon} />
            <div className={styles.meta}>
              <span className={styles.name} title={doc.filename}>{doc.filename} (v{doc.version})</span>
              <span className={styles.hash}>SHA-256: {doc.sha256.slice(0, 12)}…</span>
            </div>
          </div>
          {canReplace && !isBusy && (
            <label className={styles.uploadLabel} title="Заменить файл (до 1 MiB)">
              <Upload className={styles.uploadIcon} /><span>Заменить</span>
              <input
                type="file"
                aria-label={`Заменить ${doc.filename}`}
                className={styles.fileInput}
                onChange={(e) => { void handleFileChange(doc.id, e.target.files?.[0]); e.target.value = ''; }}
              />
            </label>
          )}
        </div>
      ))}
    </div>
  );
}
