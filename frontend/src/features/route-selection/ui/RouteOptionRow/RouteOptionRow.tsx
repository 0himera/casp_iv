'use client';

import { ArrowRight, Check } from 'lucide-react';
import type { Route } from '@/shared/api/caspian';
import { formatMskDateTime, formatProbability, formatRubFromMinor } from '@/shared/lib/formatters';
import { Badge, Button } from '@/shared/ui';
import styles from './RouteOptionRow.module.css';

interface RouteOptionRowProps {
  route: Route;
  isSelected: boolean;
  canSelect: boolean;
  onSelect: (routeId: string) => void;
}

export function RouteOptionRow({ route, isSelected, canSelect, onSelect }: RouteOptionRowProps) {
  const isBackend = route.id === 'route_astra' || route.id === 'route_makh';
  return (
    <div className={`${styles.row} ${isSelected ? styles.selected : ''}`}>
      <div className={styles.top}>
        <span className={styles.name}>{route.name}</span>
        <div className={styles.badges}>
          {!isBackend && <Badge variant="outline">Симуляция</Badge>}
          <Badge variant={route.feasible ? 'secondary' : 'destructive'}>
            Риск: {formatProbability(route.miss_probability)}
          </Badge>
        </div>
      </div>
      <div className={styles.metrics}>
        <span>ETA: {formatMskDateTime(route.eta.p50)}</span>
        <span>{formatRubFromMinor(route.cost.amount_minor)}</span>
        <span>{route.emissions_kg_co2e !== null ? `${route.emissions_kg_co2e} кг CO₂e` : 'Нет данных'}</span>
      </div>
      {!route.feasible && route.infeasibility_reason && (
        <div className={styles.warn}>{route.infeasibility_reason}</div>
      )}
      {route.feasible && !isSelected && (
        <div className={styles.actionRow}>
          {route.requires_reapproval && (
            <span className={styles.reapproval}>Потребуется повторное согласование документов и маршрута</span>
          )}
          <Button type="button" size="sm" disabled={!canSelect} onClick={() => onSelect(route.id)}>
            {isBackend ? 'Выбрать' : 'Симулировать'} <ArrowRight className={styles.icon} />
          </Button>
        </div>
      )}
      {isSelected && (
        <div className={styles.activeTag}><Check className={styles.icon} /> Текущий маршрут</div>
      )}
    </div>
  );
}
