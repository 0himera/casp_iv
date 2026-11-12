'use client';

import { Package } from 'lucide-react';
import { getMovementStatusLabel, getPassportStatusLabel } from '@/entities/shipment';
import type { ShipmentSummary } from '@/shared/api/caspian';
import { formatMskDateTime, formatProbability } from '@/shared/lib/formatters';
import { Badge } from '@/shared/ui';
import styles from './CargoItemCard.module.css';

interface CargoItemCardProps {
  item: ShipmentSummary;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function CargoItemCard({ item, isSelected, onSelect }: CargoItemCardProps) {
  const variant = item.passport_status === 'ready' ? 'success' : item.passport_status === 'blocked' ? 'destructive' : 'warning';
  return (
    <button type="button" onClick={() => onSelect(item.id)} className={`${styles.item} ${isSelected ? styles.selected : ''}`}>
      <div className={styles.topRow}>
        <span className={styles.codeWrap}>
          <Package className={styles.icon} />
          <span className={styles.code}>{item.id}</span>
        </span>
        <Badge variant={variant}>{getPassportStatusLabel(item.passport_status)}</Badge>
      </div>
      <div className={styles.route}>{item.origin} → {item.destination} · {item.title}</div>
      <div className={styles.bottomRow}>
        <span>{getMovementStatusLabel(item.movement_status)} · {formatMskDateTime(item.eta)}</span>
        <span className={styles.delay}>Риск: {formatProbability(item.miss_probability)}</span>
      </div>
    </button>
  );
}
