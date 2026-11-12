import type { CaspianPort } from '@/entities/cargo';
import type { Shipment } from '@/shared/api/caspian';

export interface SpatialCoreProps {
  mode: 'map' | 'graph';
  ports: CaspianPort[];
  shipment: Shipment;
  stormActive: boolean;
  xrayMode: boolean;
}
