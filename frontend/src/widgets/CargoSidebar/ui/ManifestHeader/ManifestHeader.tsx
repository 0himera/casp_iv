'use client';

import { X } from 'lucide-react';
import { PixelMarker } from '@/shared/ui';
import styles from './ManifestHeader.module.css';

interface ManifestHeaderProps {
  revision: number;
  count: number;
  onClose?: () => void;
}

export function ManifestHeader({ revision, count, onClose }: ManifestHeaderProps) {
  return (
    <div className={styles.header}>
      <span className={styles.titleWrap}>
        <PixelMarker variant="telemetry" />
        <h2 className={styles.heading}>Манифест (rev.{revision})</h2>
      </span>
      <div className={styles.right}>
        <span className={styles.counter}>* {count}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className={styles.closeBtn}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
