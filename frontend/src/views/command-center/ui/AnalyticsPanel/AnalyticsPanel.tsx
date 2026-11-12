'use client';

import type { Shipment } from '@/shared/api/caspian';
import { EsgWidget } from '@/widgets/EsgWidget';
import { PredictiveChart } from '@/widgets/PredictiveChart';
import styles from './AnalyticsPanel.module.css';

interface AnalyticsPanelProps {
  shipment: Shipment;
  stormActive: boolean;
  isOpen: boolean;
}

export function AnalyticsPanel({
  shipment,
  stormActive,
  isOpen,
}: AnalyticsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <PredictiveChart shipment={shipment} stormActive={stormActive} />
      <EsgWidget shipment={shipment} />
    </div>
  );
}
