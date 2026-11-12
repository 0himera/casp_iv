'use client';

import { Marker } from 'react-map-gl/maplibre';
import { Anchor, Navigation } from 'lucide-react';
import type { CaspianPort } from '@/entities/cargo';
import type { Shipment } from '@/shared/api/caspian';
import styles from './PortMarkers.module.css';

interface PortMarkersProps {
  ports: CaspianPort[];
  shipment: Shipment;
  stormActive: boolean;
}

export function PortMarkers({ ports, shipment, stormActive }: PortMarkersProps) {
  const { current_location: curr } = shipment;
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
              <span className={styles.portLabel}>{port.name}</span>
            </div>
          </Marker>
        );
      })}
      <Marker longitude={curr.longitude} latitude={curr.latitude} anchor="center">
        <div className={styles.cargoMarker}>
          <span className={styles.pulseRing} />
          <span className={styles.cargoCore}><Navigation className={styles.cargoIcon} /></span>
          <span className={styles.cargoBadge}>{curr.name}</span>
        </div>
      </Marker>
    </>
  );
}
