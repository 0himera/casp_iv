'use client';

import type { CaspianPort } from '@/entities/cargo';
import type { Role, Shipment } from '@/shared/api/caspian';
import { CorridorExplorer } from '../CorridorExplorer';
import { MapInspectionOverlays } from '../MapInspectionOverlays';
import { MapQuickDock } from '../MapQuickDock';

interface CaspianMapDockProps {
  networkOpen: boolean; dockOpen: boolean; ports: CaspianPort[]; shipment: Shipment;
  selectedPort: CaspianPort | null; cargoSelected: boolean; stormSelected: boolean;
  role?: Role; isBusy?: boolean;
  onCloseNetwork: () => void; onHighlight: (ids: string[]) => void;
  onSelectRoute?: (routeId: string) => void; onHoverRoute?: (routeId: string | null) => void;
  onSelectPort: (port: CaspianPort) => void; onChangeRole?: (role: Role) => void;
  onAttest?: (decision: 'approved' | 'rejected') => void; onCloseInspection: () => void; onCollapseDock: () => void;
}

export function CaspianMapDock(p: CaspianMapDockProps) {
  if (p.networkOpen) return <CorridorExplorer onClose={p.onCloseNetwork} onHighlight={p.onHighlight} />;
  if (p.selectedPort || p.cargoSelected || p.stormSelected) {
    return (
      <MapInspectionOverlays
        shipment={p.shipment} selectedPort={p.selectedPort} cargoSelected={p.cargoSelected}
        stormSelected={p.stormSelected} onSelectRoute={p.onSelectRoute} onClose={p.onCloseInspection}
      />
    );
  }
  if (p.dockOpen) {
    return (
      <MapQuickDock
        shipment={p.shipment} ports={p.ports} role={p.role} isBusy={p.isBusy}
        onSelectRoute={p.onSelectRoute} onHoverRoute={p.onHoverRoute} onSelectPort={p.onSelectPort}
        onChangeRole={p.onChangeRole} onAttest={p.onAttest} onCollapse={p.onCollapseDock}
      />
    );
  }
  return null;
}
