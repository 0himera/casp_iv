'use client';

import { useState } from 'react';
import { Anchor, ArrowRight, Route as RouteIcon, ShieldCheck, X } from 'lucide-react';
import type { CaspianPort } from '@/entities/cargo';
import type { Role, Shipment } from '@/shared/api/caspian';
import { DockPassportTab } from './DockPassportTab';
import { DockRoutesList } from './DockRoutesList';
import styles from './MapQuickDock.module.css';

interface MapQuickDockProps {
  shipment: Shipment; ports: CaspianPort[]; role?: Role; isBusy?: boolean;
  onSelectRoute?: (routeId: string) => void; onHoverRoute?: (routeId: string | null) => void;
  onSelectPort: (port: CaspianPort) => void; onChangeRole?: (role: Role) => void;
  onAttest?: (decision: 'approved' | 'rejected') => void; onCollapse: () => void;
}

export function MapQuickDock(p: MapQuickDockProps) {
  const [tab, setTab] = useState<'routes' | 'ports' | 'passport'>('routes');
  return (
    <div className={styles.wrap}>
      <div className={styles.tabsRow}>
        <div className={styles.tabs}>
          <button type="button" onClick={() => setTab('routes')} className={`${styles.tabBtn} ${tab === 'routes' ? styles.activeTab : ''}`}><RouteIcon className={styles.icon} /> Маршруты</button>
          <button type="button" onClick={() => setTab('ports')} className={`${styles.tabBtn} ${tab === 'ports' ? styles.activeTab : ''}`}><Anchor className={styles.icon} /> Порты</button>
          <button type="button" onClick={() => setTab('passport')} className={`${styles.tabBtn} ${tab === 'passport' ? styles.activeTab : ''}`}><ShieldCheck className={styles.icon} /> eCMR</button>
        </div>
        <button type="button" onClick={p.onCollapse} className={styles.closeBtn} aria-label="Скрыть меню"><X className={styles.icon} /></button>
      </div>
      {tab === 'routes' && <DockRoutesList shipment={p.shipment} role={p.role} onSelectRoute={p.onSelectRoute} onHoverRoute={p.onHoverRoute} onChangeRole={p.onChangeRole} />}
      {tab === 'ports' && (
        <div className={styles.list}>
          {p.ports.map((port) => (
            <button key={port.id} type="button" className={styles.portRow} onClick={() => p.onSelectPort(port)}>
              <div><div className={styles.title}>{port.name}</div><div className={styles.meta}>{port.country} · {port.lat.toFixed(2)}°N, {port.lng.toFixed(2)}°E</div></div>
              <ArrowRight className={styles.icon} />
            </button>
          ))}
        </div>
      )}
      {tab === 'passport' && <DockPassportTab shipment={p.shipment} role={p.role} isBusy={p.isBusy} onAttest={p.onAttest} />}
    </div>
  );
}
