'use client';

import { useState } from 'react';
import { FileText, Upload, Download, Loader2 } from 'lucide-react';
import type { Document } from '@/shared/api/caspian';
import { readFileAsBase64 } from '@/shared/lib/formatters';
import styles from './DocumentList.module.css';

interface DocumentListProps {
  documents: Document[];
  onDownload?: (doc: Document) => Promise<Blob>;
  canReplace: boolean;
  isBusy: boolean;
  onReplaceDocument: (documentId: string, filename: string, contentBase64: string) => void;
}

export function DocumentList({
  documents,
  onDownload,
  canReplace,
  isBusy,
  onReplaceDocument,
}: DocumentListProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const download = async (doc: Document) => {
    if (!onDownload || downloading) return;
    setDownloading(doc.id); setError(null);
    try {
      const blob = await onDownload(doc);
      const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
      const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
      if (hash !== doc.sha256) throw new Error('Хеш файла не совпадает с подтверждённой версией. Скачивание отменено.');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = doc.filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось скачать документ'); }
    finally { setDownloading(null); }
  };
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
          <div className={styles.docActions}>
          {onDownload && <button className={styles.download} aria-label={`Скачать ${doc.filename}`} title="Скачать и проверить SHA-256" disabled={!!downloading} onClick={() => void download(doc)}>{downloading === doc.id ? <Loader2 size={15} className={styles.spin} /> : <Download size={15} />}</button>}
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
        </div>
      ))}
    </div>
  );
}
