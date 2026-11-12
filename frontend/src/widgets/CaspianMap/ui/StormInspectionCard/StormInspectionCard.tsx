'use client';

import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { Button, ViewfinderFrame } from '@/shared/ui';
import styles from './StormInspectionCard.module.css';

interface StormInspectionCardProps {
  shipment: Shipment;
  onSelectRoute?: (routeId: string) => void;
  onClose: () => void;
}

export function StormInspectionCard({
  shipment,
  onSelectRoute,
  onClose,
}: StormInspectionCardProps) {
  const altRoute = shipment.routes.find((r) => r.id !== shipment.selected_route_id);

  return (
    <ViewfinderFrame stamp="[ 03-RISK / STORM-ZONE ]" className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <AlertTriangle className={styles.icon} />
          <div>
            <h4 className={styles.name}>Штормовой сценарий: Энзели</h4>
            <span className={styles.meta}>Южный Каспий · 37.47°N, 49.46°E</span>
          </div>
        </div>
        <button type="button" onClick={onClose} className={styles.closeBtn}><X className={styles.closeIcon} /></button>
      </div>
      <div className={styles.desc}>
        Демонстрационный сценарий: волна 3,8 м, порывы 62 км/ч и риск 84%. Это не актуальное предупреждение и не подтверждение закрытия переправы.
      </div>
      {altRoute && (
        <Button type="button" size="sm" onClick={() => onSelectRoute?.(altRoute.id)} className={styles.rerouteBtn}>
          Следовать в обход через {altRoute.name} <ArrowRight className={styles.arrow} />
        </Button>
      )}
    </ViewfinderFrame>
  );
}

