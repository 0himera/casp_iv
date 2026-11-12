'use client';

import { ArrowRight, Check, Loader2, Lock } from 'lucide-react';
import type { Role, Shipment } from '@/shared/api/caspian';
import { formatMskDateTime, formatProbability, formatRubFromMinor } from '@/shared/lib/formatters';
import { Badge, Button } from '@/shared/ui';
import styles from './MapQuickDock.module.css';

interface DockRoutesListProps {
  shipment: Shipment;
  role?: Role;
  isBusy?: boolean;
  onSelectRoute?: (routeId: string) => void;
  onHoverRoute?: (routeId: string | null) => void;
  onChangeRole?: (role: Role) => void;
}

export function DockRoutesList({ shipment, role, isBusy, onSelectRoute, onHoverRoute, onChangeRole }: DockRoutesListProps) {
  const canSelect = shipment.allowed_actions.includes('select_route');
  const active = shipment.routes.find((r) => r.id === shipment.selected_route_id);

  return (
    <div className={styles.list}>
      <div className={styles.stageBar}>
        <span>{shipment.origin.name}</span><ArrowRight className={styles.icon} />
        <span>Каспийский транзит</span><ArrowRight className={styles.icon} />
        <span>{shipment.destination.name}</span>
      </div>
      {!canSelect && onChangeRole && role !== 'logistician' && (
        <div className={styles.roleHint}>
          <span><Lock className={styles.icon} /> Выбор маршрута доступен роли «Логист»</span>
          <Button type="button" size="sm" variant="outline" onClick={() => onChangeRole('logistician')}>Стать Логистом</Button>
        </div>
      )}
      {shipment.routes.map((r) => {
        const isCurrent = r.id === shipment.selected_route_id;
        const hasTariffs = active && active.cost.amount_minor > 0 && r.cost.amount_minor > 0;
        const deltaRub = hasTariffs ? (r.cost.amount_minor - active.cost.amount_minor) / 100 : 0;
        const deltaCo2 = active && r.emissions_kg_co2e !== null && active.emissions_kg_co2e !== null ? r.emissions_kg_co2e - active.emissions_kg_co2e : null;
        return (
          <div key={r.id} onMouseEnter={() => onHoverRoute?.(r.id)} onMouseLeave={() => onHoverRoute?.(null)} className={`${styles.card} ${isCurrent ? styles.cardActive : ''}`}>
            <div className={styles.rowBetween}><span className={styles.title}>{r.name}</span><Badge variant={r.feasible ? 'secondary' : 'destructive'}>Риск: {formatProbability(r.miss_probability)}</Badge></div>
            <span className={styles.meta}>ETA: {formatMskDateTime(r.eta.p50)} · {r.cost.amount_minor > 0 ? formatRubFromMinor(r.cost.amount_minor) : 'Тариф не подтверждён'}</span>
            {!isCurrent && hasTariffs && <span className={styles.deltaRow}>{deltaRub >= 0 ? `+${Math.round(deltaRub).toLocaleString('ru-RU')}` : Math.round(deltaRub).toLocaleString('ru-RU')} ₽ {deltaCo2 !== null ? `· ${deltaCo2 >= 0 ? `+${deltaCo2}` : deltaCo2} кг CO₂` : ''}</span>}
            {isCurrent ? <span className={styles.activeTag}><Check className={styles.icon} /> Активный маршрут</span>
              : r.feasible ? <Button type="button" size="sm" disabled={!canSelect || isBusy} onClick={() => onSelectRoute?.(r.id)}>{isBusy ? <><Loader2 className={styles.spinIcon} /> Запись...</> : <>Выбрать маршрут <ArrowRight className={styles.icon} /></>}</Button>
              : <span className={styles.warn}>{r.infeasibility_reason ?? 'Недоступно'}</span>}
          </div>
        );
      })}
    </div>
  );
}
