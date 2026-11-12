'use client';

import { Navigation } from 'lucide-react';
import { PixelMarker } from '@/shared/ui';
import styles from './CargoMarkerItem.module.css';

interface CargoMarkerItemProps {
  locationName: string;
}

export function CargoMarkerItem({ locationName }: CargoMarkerItemProps) {
  return (
    <div className={styles.cargoMarker}>
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
