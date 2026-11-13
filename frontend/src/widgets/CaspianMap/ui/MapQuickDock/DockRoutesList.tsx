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

  return (
    <div className={styles.list}>
      <p className={styles.intro}>Сравните готовность к отправлению, риск срыва и транспортную цепочку. Оценки рассчитаны по условиям сценария.</p>
      {!canSelect && onChangeRole && role !== 'logistician' && (
        <div className={styles.roleHint}>
          <span><Lock className={styles.icon} /> Выбор маршрута доступен роли «Логист»</span>
          <Button type="button" size="sm" variant="outline" onClick={() => onChangeRole('logistician')}>Стать Логистом</Button>
        </div>
      )}
      {[...shipment.routes].sort((a, b) => Number(b.id === shipment.selected_route_id) - Number(a.id === shipment.selected_route_id)).map((r) => {
        const isCurrent = r.id === shipment.selected_route_id;
        return (
          <div key={r.id} onFocus={() => onHoverRoute?.(r.id)} onBlur={() => onHoverRoute?.(null)} onMouseEnter={() => onHoverRoute?.(r.id)} onMouseLeave={() => onHoverRoute?.(null)} className={`${styles.card} ${isCurrent ? styles.cardActive : ''}`}>
            <div className={styles.rowBetween}><span className={styles.title}>{r.name}</span><Badge variant={!r.feasible || (r.miss_probability ?? 0) >= 0.8 ? 'destructive' : (r.miss_probability ?? 0) >= 0.5 ? 'warning' : 'secondary'}>Риск: {formatProbability(r.miss_probability)}</Badge></div>
            <span className={styles.meta}>{r.modes.map((mode) => ({ rail: 'Ж/д', road: 'Авто', sea: 'Море' }[mode] ?? mode)).join(' → ')}</span>
            <strong className={r.cost.amount_minor > 0 ? styles.price : styles.priceUnknown}>{r.cost.amount_minor > 0 ? formatRubFromMinor(r.cost.amount_minor) : 'Тариф не подтверждён'}</strong>
            <span className={styles.meta}>Доставка P50: {formatMskDateTime(r.eta.p50)}</span>
            {isCurrent ? <span className={styles.activeTag}><Check className={styles.icon} /> Активный маршрут</span>
              : r.feasible ? <Button type="button" size="sm" variant="outline" className={styles.chooseButton} disabled={!canSelect || isBusy} onClick={() => onSelectRoute?.(r.id)}>{isBusy ? <><Loader2 className={styles.spinIcon} /> Запись...</> : <>Выбрать маршрут <ArrowRight className={styles.icon} /></>}</Button>
              : <span className={styles.warn}>{r.infeasibility_reason ?? 'Недоступно'}</span>}
          </div>
        );
      })}
    </div>
  );
}
