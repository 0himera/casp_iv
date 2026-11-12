'use client';

import { Anchor, ArrowRight, Check, Compass, Lock, Navigation, X } from 'lucide-react';
import type { CaspianPort } from '@/entities/cargo';
import type { Role, Shipment } from '@/shared/api/caspian';
import { formatProbability, formatRubFromMinor } from '@/shared/lib/formatters';
import { Button } from '@/shared/ui';
import { findNearestPort } from '../../model/findNearestPort';
import styles from './MapClickMenu.module.css';

export interface MapClickPoint { x: number; y: number; lng: number; lat: number; width: number; height: number; }
interface MapClickMenuProps {
  point: MapClickPoint; ports: CaspianPort[]; shipment: Shipment; role?: Role;
  onInspectPort: (port: CaspianPort) => void; onSelectRoute?: (routeId: string) => void;
  onHoverRoute?: (routeId: string | null) => void; onChangeRole?: (role: Role) => void;
  onFocusCargo: () => void; onResetView: () => void; onClose: () => void;
}

export function MapClickMenu({ point, ports, shipment, role, onInspectPort, onSelectRoute, onHoverRoute, onChangeRole, onFocusCargo, onResetView, onClose }: MapClickMenuProps) {
  const nearest = findNearestPort(point.lng, point.lat, ports);
  const canSelect = shipment.allowed_actions.includes('select_route');
  const left = Math.min(Math.max(12, point.x + 12), Math.max(12, point.width - 296));
  const top = Math.min(Math.max(44, point.y - 20), Math.max(44, point.height - 340));
  return (
    <div className={styles.menu} style={{ left, top }} onClick={(e) => e.stopPropagation()}>
      <div className={styles.head}>
        <span className={styles.coords}>{`${point.lat.toFixed(2)}°N · ${point.lng.toFixed(2)}°E`}</span>
        <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Закрыть"><X className={styles.icon} /></button>
      </div>
      {nearest && (
        <button type="button" className={styles.portQuickBtn} onClick={() => { onInspectPort(nearest.port); onClose(); }}>
          <span className={styles.portInfo}><Anchor className={styles.cyanIcon} /> {nearest.port.name} ({nearest.distanceKm} км)</span>
          <ArrowRight className={styles.icon} />
        </button>
      )}
      <div className={styles.sectionTitle}>ВЫБОР МАРШРУТА</div>
      {!canSelect && onChangeRole && role !== 'logistician' && (
        <button type="button" className={styles.roleBtn} onClick={() => onChangeRole('logistician')}>
          <Lock className={styles.icon} /> Активировать роль: Логист
        </button>
      )}
      <div className={styles.routeList}>
        {shipment.routes.map((r) => {
          const active = r.id === shipment.selected_route_id;
          return (
            <button key={r.id} type="button" disabled={!canSelect || !r.feasible || active} onMouseEnter={() => onHoverRoute?.(r.id)} onMouseLeave={() => onHoverRoute?.(null)} onClick={() => { onSelectRoute?.(r.id); onHoverRoute?.(null); onClose(); }} className={`${styles.routeItem} ${active ? styles.routeActive : ''}`}>
              <div className={styles.routeTop}><span className={styles.routeName}>{r.name}</span>{active ? <Check className={styles.okIcon} /> : <span className={styles.risk}>{formatProbability(r.miss_probability)}</span>}</div>
              <span className={styles.routeMeta}>{formatRubFromMinor(r.cost.amount_minor)} · {r.distance_km} км</span>
            </button>
          );
        })}
      </div>
      <div className={styles.footer}>
        <Button type="button" size="sm" variant="outline" onClick={() => { onFocusCargo(); onClose(); }}><Navigation className={styles.icon} /> К грузу</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { onResetView(); onClose(); }}><Compass className={styles.icon} /> Обзор</Button>
      </div>
    </div>
  );
}
