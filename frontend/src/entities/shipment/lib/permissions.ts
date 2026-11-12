import type { Role, Shipment } from '@/shared/api/caspian';

export function actionsForRole(shipment: Shipment, role: Role): Shipment['allowed_actions'] {
  const decided = shipment.passport.attestations.some((a) =>
    a.role === role && a.version === shipment.passport.version);
  return shipment.allowed_actions.filter((action) =>
    action === 'attest' ? !decided : role === 'logistician');
}
