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
  return (
    <div className={`${styles.row} ${isSelected ? styles.selected : ''}`}>
      <div className={styles.top}>
        <span className={styles.name}>{route.name}</span>
        <div className={styles.badges}>
          <Badge variant="outline">{route.capacity_status === 'unknown' ? 'Места не подтверждены' : 'Места: допущение'}</Badge>
          <Badge variant={route.feasible ? 'secondary' : 'destructive'}>
            Риск: {formatProbability(route.miss_probability)}
          </Badge>
        </div>
      </div>
      <div className={styles.metrics}>
        <span>ETA: {formatMskDateTime(route.eta.p50)}</span>
        <span>{route.cost.amount_minor > 0 ? formatRubFromMinor(route.cost.amount_minor) : 'Тариф не подтверждён'}</span>
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
            Выбрать <ArrowRight className={styles.icon} />
          </Button>
        </div>
      )}
      {isSelected && (
        <div className={styles.activeTag}><Check className={styles.icon} /> Текущий маршрут</div>
      )}
    </div>
  );
}
