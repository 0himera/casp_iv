'use client';

import { Marker } from 'react-map-gl/maplibre';
import { Anchor, Navigation } from 'lucide-react';
import type { CargoItem, CaspianPort } from '@/entities/cargo';
import styles from './PortMarkers.module.css';

interface PortMarkersProps {
  ports: CaspianPort[];
  selectedCargo: CargoItem;
  stormActive: boolean;
}

export function PortMarkers({
  ports,
  selectedCargo,
  stormActive,
}: PortMarkersProps) {
  const [cargoLng, cargoLat] = selectedCargo.currentPosition;
  return (
    <>
      {ports.map((port) => {
        const isDanger = port.id === 'anzali' && stormActive;
        return (
          <Marker key={port.id} longitude={port.lng} latitude={port.lat} anchor="center">
            <div className={styles.portMarker}>
              <span className={`${styles.portDot} ${isDanger ? styles.portDanger : ''}`}>
                <Anchor className={styles.portIcon} />
              </span>
              <span className={styles.portLabel}>
                {port.name} · {isDanger ? '98%' : `${port.loadPercent}%`}
              </span>
            </div>
          </Marker>
        );
      })}
      <Marker longitude={cargoLng} latitude={cargoLat} anchor="center">
        <div className={styles.cargoMarker}>
          <span className={styles.pulseRing} />
          <span className={styles.cargoCore}>
            <Navigation className={styles.cargoIcon} />
          </span>
          <span className={styles.cargoBadge}>{selectedCargo.code}</span>
        </div>
      </Marker>
    </>
  );
}

