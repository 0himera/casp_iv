'use client';

import { Navigation, X } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { formatMskDateTime, formatProbability } from '@/shared/lib/formatters';
import { ViewfinderFrame } from '@/shared/ui';
import styles from './CargoInspectionCard.module.css';

interface CargoInspectionCardProps {
  shipment: Shipment;
  onClose: () => void;
}

export function CargoInspectionCard({ shipment, onClose }: CargoInspectionCardProps) {
  const selectedRoute = shipment.routes.find((r) => r.id === shipment.selected_route_id);

  return (
    <ViewfinderFrame stamp="[ 00-CARGO / TRACKING ]" className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <Navigation className={styles.icon} />
          <div>
            <h4 className={styles.name}>{shipment.title}</h4>
            <span className={styles.title}>{shipment.id}</span>
          </div>
        </div>
        <button type="button" onClick={onClose} className={styles.closeBtn}><X className={styles.closeIcon} /></button>
      </div>
      <div className={styles.routeRow}>
        <span className={styles.loc}>{shipment.origin.name}</span>
        <span className={styles.arrow}>→</span>
        <span className={styles.loc}>{shipment.destination.name}</span>
      </div>
      <div className={styles.grid}>
        <div className={styles.metric}><span className={styles.k}>Масса</span><span className={styles.v}>{shipment.mass_tonnes} т</span></div>
        <div className={styles.metric}><span className={styles.k}>Риск срыва</span><span className={styles.v}>{formatProbability(shipment.forecast.miss_probability)}</span></div>
        <div className={styles.metric}><span className={styles.k}>Маршрут</span><span className={styles.v}>{selectedRoute?.name ?? '—'}</span></div>
        <div className={styles.metric}><span className={styles.k}>ETA (P50)</span><span className={styles.v}>{selectedRoute ? formatMskDateTime(selectedRoute.eta.p50) : '—'}</span></div>
      </div>
    </ViewfinderFrame>
  );
}

