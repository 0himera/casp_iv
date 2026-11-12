'use client';

import { Marker } from 'react-map-gl/maplibre';
import type { CaspianPort } from '@/entities/cargo';
import { resolvePortTelemetry } from '@/entities/cargo';
import type { Shipment } from '@/shared/api/caspian';
import { CargoMarkerItem } from './CargoMarkerItem';
import { PortMarkerItem } from './PortMarkerItem';
import styles from './PortMarkers.module.css';

interface PortMarkersProps {
  ports: CaspianPort[];
  shipment: Shipment;
  stormActive: boolean;
  xrayMode?: boolean;
}

export function PortMarkers({
  ports,
  shipment,
  stormActive,
  xrayMode = false,
}: PortMarkersProps) {
  const { current_location: curr } = shipment;

  return (
    <div className={styles.layer}>
      {ports.map((rawPort) => {
        const port = resolvePortTelemetry(rawPort, stormActive);
        const isDanger = port.id === 'anzali' && stormActive;
        return (
          <Marker
            key={port.id}
            longitude={port.lng}
            latitude={port.lat}
            anchor="center"
          >
            <PortMarkerItem
              port={port}
              isDanger={isDanger}
              xrayMode={xrayMode}
            />
          </Marker>
        );
      })}
      <Marker
        longitude={curr.longitude}
        latitude={curr.latitude}
        anchor="center"
      >
        <CargoMarkerItem locationName={curr.name} />
      </Marker>
    </div>
  );
}
