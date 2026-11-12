'use client';

import { Marker } from 'react-map-gl/maplibre';
import { Anchor, Navigation } from 'lucide-react';
import type { CaspianPort } from '@/entities/cargo';
import type { Shipment } from '@/shared/api/caspian';
import { PixelMarker } from '@/shared/ui';
import styles from './PortMarkers.module.css';

interface PortMarkersProps {
  ports: CaspianPort[];
  shipment: Shipment;
  stormActive: boolean;
  xrayMode?: boolean;
}

export function PortMarkers({ ports, shipment, stormActive, xrayMode = false }: PortMarkersProps) {
  const { current_location: curr } = shipment;
  return (
    <>
      {ports.map((port) => {
        const isDanger = port.id === 'anzali' && stormActive;
        return (
          <Marker key={port.id} longitude={port.lng} latitude={port.lat} anchor="center">
            <div className={styles.portMarker}>
              <span className={`${styles.portReticle} ${isDanger ? styles.portDanger : ''} ${xrayMode ? styles.portXray : ''}`}>
                <Anchor className={styles.portIcon} />
              </span>
              <span className={styles.portLabel}>{port.name}</span>
              {xrayMode && <span className={styles.coordTag}>{port.lat.toFixed(2)}°N {port.lng.toFixed(2)}°E</span>}
            </div>
          </Marker>
        );
      })}
      <Marker longitude={curr.longitude} latitude={curr.latitude} anchor="center">
        <div className={styles.cargoMarker}>
          <span className={styles.cargoCore}><Navigation className={styles.cargoIcon} /></span>
          <span className={styles.cargoBadge}>
            <PixelMarker variant="telemetry" />
            <span>{curr.name}</span>
          </span>
        </div>
      </Marker>
    </>
  );
}
