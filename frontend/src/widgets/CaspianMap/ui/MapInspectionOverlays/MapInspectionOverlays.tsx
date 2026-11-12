'use client';

import type { CaspianPort } from '@/entities/cargo';
import type { Shipment } from '@/shared/api/caspian';
import { CargoInspectionCard } from '../CargoInspectionCard';
import { PortInspectionCard } from '../PortInspectionCard';
import { StormInspectionCard } from '../StormInspectionCard';

interface MapInspectionOverlaysProps {
  shipment: Shipment;
  selectedPort: CaspianPort | null;
  cargoSelected: boolean;
  stormSelected: boolean;
  onSelectRoute?: (routeId: string) => void;
  onClose: () => void;
}

export function MapInspectionOverlays({
  shipment,
  selectedPort,
  cargoSelected,
  stormSelected,
  onSelectRoute,
  onClose,
}: MapInspectionOverlaysProps) {
  return (
    <>
      {selectedPort && (
        <PortInspectionCard port={selectedPort} shipment={shipment} onSelectRoute={onSelectRoute} onClose={onClose} />
      )}
      {cargoSelected && (
        <CargoInspectionCard shipment={shipment} onClose={onClose} />
      )}
      {stormSelected && (
        <StormInspectionCard shipment={shipment} onSelectRoute={onSelectRoute} onClose={onClose} />
      )}
    </>
  );
}
