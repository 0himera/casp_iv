'use client';

import { Navigation } from 'lucide-react';
import { PixelMarker } from '@/shared/ui';
import styles from './CargoMarkerItem.module.css';

interface CargoMarkerItemProps {
  locationName: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function CargoMarkerItem({
  locationName,
  isSelected,
  onClick,
}: CargoMarkerItemProps) {
  return (
    <div
      className={`${styles.cargoMarker} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <span className={styles.cargoCore}>
        <Navigation className={styles.cargoIcon} />
      </span>
      <span className={styles.cargoBadge}>
        <PixelMarker variant="telemetry" />
        <span>{locationName}</span>
      </span>
    </div>
  );
}
