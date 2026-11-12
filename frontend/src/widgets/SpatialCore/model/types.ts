import type { CaspianPort } from '@/entities/cargo';
import type { Role, Shipment } from '@/shared/api/caspian';

export interface SpatialCoreProps {
  mode: 'map' | 'graph';
  ports: CaspianPort[];
  shipment: Shipment;
  stormActive: boolean;
  xrayMode: boolean;
  role?: Role;
  isBusy?: boolean;
  onSelectRoute?: (routeId: string) => void;
  onChangeRole?: (role: Role) => void;
  onAttest?: (decision: 'approved' | 'rejected') => void;
}
