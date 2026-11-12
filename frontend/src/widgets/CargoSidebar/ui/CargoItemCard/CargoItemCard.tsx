'use client';

import { Package } from 'lucide-react';
import {
  getCargoBadgeVariant,
  getCargoStatusLabel,
  type CargoItem,
} from '@/entities/cargo';
import { Badge } from '@/shared/ui';
import styles from './CargoItemCard.module.css';

interface CargoItemCardProps {
  cargo: CargoItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function CargoItemCard({
  cargo,
  isSelected,
  onSelect,
}: CargoItemCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(cargo.id)}
      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
    >
      <div className={styles.topRow}>
        <span className={styles.codeWrap}>
          <Package className={styles.icon} />
          <span className={styles.code}>{cargo.code}</span>
        </span>
        <Badge variant={getCargoBadgeVariant(cargo.status)}>
          {getCargoStatusLabel(cargo.status)}
        </Badge>
      </div>
      <div className={styles.route}>{cargo.routeTitle}</div>
      <div className={styles.bottomRow}>
        <span>{cargo.cargoType}</span>
        {cargo.delayHours > 0 && (
          <span className={styles.delay}>+{cargo.delayHours} ч</span>
        )}
      </div>
    </button>
  );
}

