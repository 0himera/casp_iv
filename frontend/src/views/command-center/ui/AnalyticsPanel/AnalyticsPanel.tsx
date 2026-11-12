'use client';

import { X } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { EsgWidget } from '@/widgets/EsgWidget';
import { PredictiveChart } from '@/widgets/PredictiveChart';
import styles from './AnalyticsPanel.module.css';

interface AnalyticsPanelProps {
  shipment: Shipment;
  stormActive: boolean;
  isOpen: boolean;
  onClose?: () => void;
}

export function AnalyticsPanel({
  shipment,
  stormActive,
  isOpen,
  onClose,
}: AnalyticsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      {onClose && (
        <div className={styles.header}>
          <span className={styles.tag}>[ 03-TELEMETRY & ESG ]</span>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X className={styles.closeIcon} />
          </button>
        </div>
      )}
      <PredictiveChart shipment={shipment} stormActive={stormActive} />
      <EsgWidget shipment={shipment} />
    </div>
  );
}
