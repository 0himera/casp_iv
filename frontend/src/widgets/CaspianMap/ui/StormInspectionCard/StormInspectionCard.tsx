'use client';

import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { Button, ViewfinderFrame } from '@/shared/ui';
import styles from './StormInspectionCard.module.css';

interface StormInspectionCardProps {
  shipment: Shipment;
  isBusy?: boolean;
  onSelectRoute?: (routeId: string) => void;
  onClose: () => void;
}

export function StormInspectionCard({
  shipment,
  isBusy,
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
        Сценарная зона на карте. Кнопка «Шторм» добавляет 24 часа ожидания в выбранном коридоре; риск рассчитывает сервер. Это не предупреждение о фактическом закрытии переправы.
      </div>
      {altRoute && (
        <Button type="button" size="sm" disabled={isBusy} onClick={() => onSelectRoute?.(altRoute.id)} className={styles.rerouteBtn}>
          {isBusy ? 'Перестроение...' : `Следовать в обход через ${altRoute.name}`} <ArrowRight className={styles.arrow} />
        </Button>
      )}
    </ViewfinderFrame>
  );
}

