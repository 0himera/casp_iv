'use client';

import { Anchor, ArrowRight, Check, X } from 'lucide-react';
import type { CaspianPort } from '@/entities/cargo';
import type { Shipment } from '@/shared/api/caspian';
import { Button, ViewfinderFrame } from '@/shared/ui';
import styles from './PortInspectionCard.module.css';

interface PortInspectionCardProps {
  port: CaspianPort;
  shipment: Shipment;
  onSelectRoute?: (routeId: string) => void;
  onClose: () => void;
}

export function PortInspectionCard({
  port,
  shipment,
  onSelectRoute,
  onClose,
}: PortInspectionCardProps) {
  const activeRoute = shipment.routes.find((r) => r.id === shipment.selected_route_id);
  const isInActive = activeRoute?.ports.includes(port.name);
  const portRoute = shipment.routes.find((r) => r.ports.includes(port.name));

  return (
    <ViewfinderFrame stamp="[ 04-PORT / INSPECTION ]" className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <Anchor className={styles.icon} />
          <div>
            <h4 className={styles.name}>{port.name}</h4>
            <span className={styles.meta}>{port.country} · {port.lat.toFixed(2)}°N, {port.lng.toFixed(2)}°E</span>
          </div>
        </div>
        <button type="button" onClick={onClose} className={styles.closeBtn}><X className={styles.closeIcon} /></button>
      </div>
      <div className={styles.grid}>
        <div className={styles.metric}><span className={styles.k}>Волна</span><span className={styles.v}>{port.waveHeightM} м</span></div>
        <div className={styles.metric}><span className={styles.k}>Ветер</span><span className={styles.v}>{port.windSpeedKmh} км/ч ({port.windDirectionLabel})</span></div>
        <div className={styles.metric}><span className={styles.k}>Причалы</span><span className={styles.v}>{port.berthsAvailable}/{port.totalBerths} свободно</span></div>
        <div className={styles.metric}><span className={styles.k}>На рейде</span><span className={styles.v}>{port.vesselsInRoadstead} суд.</span></div>
      </div>
      {isInActive && <div className={styles.statusRow}><Check className={styles.checkIcon} /><span>Включён в текущий маршрут</span></div>}
      {!isInActive && portRoute && (
        <Button type="button" size="sm" onClick={() => onSelectRoute?.(portRoute.id)} className={styles.routeBtn}>
          Маршрут через {port.name} <ArrowRight className={styles.arrowIcon} />
        </Button>
      )}
    </ViewfinderFrame>
  );
}
