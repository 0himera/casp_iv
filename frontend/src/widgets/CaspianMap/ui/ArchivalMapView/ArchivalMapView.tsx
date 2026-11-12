'use client';

import type { CaspianPort } from '@/entities/cargo';
import type { Shipment } from '@/shared/api/caspian';
import {
  ARCHIVAL_GEO,
  ARCHIVAL_PORTS,
  resolveArchivalPort,
} from '../../model/archivalPins';
import { ArchivalCallout } from './ui/ArchivalCallout';
import { ArchivalSvgCanvas } from './ui/ArchivalSvgCanvas';
import styles from './ArchivalMapView.module.css';

interface ArchivalMapViewProps {
  ports?: CaspianPort[];
  shipment?: Shipment;
  selectedPortId?: string | null;
  onSelectPort?: (port: CaspianPort) => void;
}

export function ArchivalMapView({
  ports = [],
  shipment,
  selectedPortId,
  onSelectPort,
}: ArchivalMapViewProps) {
  const activeId = selectedPortId ?? ports[0]?.id ?? 'aktau';
  const activeGeo = ARCHIVAL_PORTS.find((p) => p.id === activeId) ?? ARCHIVAL_PORTS[0];
  const activePort = resolveArchivalPort(activeGeo, ports);

  return (
    <div className={styles.wrap}>
      <div className={styles.sheet}>
        <ArchivalSvgCanvas
          activePortId={activeId}
          cargoLng={shipment?.current_location.longitude}
          cargoLat={shipment?.current_location.latitude}
          onSelect={(geo) => onSelectPort?.(resolveArchivalPort(geo, ports))}
        />
        <div className={styles.scanLine} aria-hidden="true" />
        <ArchivalCallout
          port={activePort}
          xPercent={(activeGeo.x / ARCHIVAL_GEO.width) * 100}
          yPercent={(activeGeo.y / ARCHIVAL_GEO.height) * 100}
        />
      </div>
      <div className={styles.caption}>
        {'[ ARCHIVAL VECTOR SHEET // ПРОЕКЦИЯ -90° CCW ]'}
      </div>
    </div>
  );
}
