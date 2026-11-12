'use client';

import { useState } from 'react';
import { Anchor, ArrowRight, Check, Route as RouteIcon, X } from 'lucide-react';
import type { CaspianPort } from '@/entities/cargo';
import type { Shipment } from '@/shared/api/caspian';
import { formatMskDateTime, formatProbability, formatRubFromMinor } from '@/shared/lib/formatters';
import { Badge, Button } from '@/shared/ui';
import styles from './MapQuickDock.module.css';

interface MapQuickDockProps {
  shipment: Shipment; ports: CaspianPort[];
  onSelectRoute?: (routeId: string) => void; onSelectPort: (port: CaspianPort) => void; onCollapse: () => void;
}

export function MapQuickDock({ shipment, ports, onSelectRoute, onSelectPort, onCollapse }: MapQuickDockProps) {
  const [tab, setTab] = useState<'routes' | 'ports'>('routes');
  const canSelect = shipment.allowed_actions.includes('select_route');
  return (
    <div className={styles.wrap}>
      <div className={styles.tabsRow}>
        <div className={styles.tabs}>
          <button type="button" onClick={() => setTab('routes')} className={`${styles.tabBtn} ${tab === 'routes' ? styles.activeTab : ''}`}><RouteIcon className={styles.icon} /> Маршруты</button>
          <button type="button" onClick={() => setTab('ports')} className={`${styles.tabBtn} ${tab === 'ports' ? styles.activeTab : ''}`}><Anchor className={styles.icon} /> Порты ({ports.length})</button>
        </div>
        <button type="button" onClick={onCollapse} className={styles.closeBtn} aria-label="Скрыть меню"><X className={styles.icon} /></button>
      </div>
      {tab === 'routes' ? (
        <div className={styles.list}>
          {shipment.routes.map((r) => {
            const active = r.id === shipment.selected_route_id;
            return (
              <div key={r.id} className={`${styles.card} ${active ? styles.cardActive : ''}`}>
                <div className={styles.rowBetween}><span className={styles.title}>{r.name}</span><Badge variant={r.feasible ? 'secondary' : 'destructive'}>Риск: {formatProbability(r.miss_probability)}</Badge></div>
                <span className={styles.meta}>ETA: {formatMskDateTime(r.eta.p50)} · {formatRubFromMinor(r.cost.amount_minor)}</span>
                {active ? <span className={styles.activeTag}><Check className={styles.icon} /> Активный маршрут</span>
                  : r.feasible ? <Button type="button" size="sm" disabled={!canSelect} onClick={() => onSelectRoute?.(r.id)}>Выбрать <ArrowRight className={styles.icon} /></Button>
                  : <span className={styles.warn}>{r.infeasibility_reason ?? 'Недоступно'}</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.list}>
          {ports.map((p) => (
            <button key={p.id} type="button" className={styles.portRow} onClick={() => onSelectPort(p)}>
              <div><div className={styles.title}>{p.name}</div><div className={styles.meta}>{p.country} · {p.lat.toFixed(2)}°N, {p.lng.toFixed(2)}°E</div></div>
              <ArrowRight className={styles.icon} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
