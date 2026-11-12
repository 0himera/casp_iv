import type { Role, Shipment } from '@/shared/api/caspian';

export function applyAttestationTransition(
  shipment: Shipment,
  decision: 'approved' | 'rejected',
  role: Role = 'customs',
  verifyAllEcmr = false
): Shipment {
  const next = structuredClone(shipment);
  const version = next.passport.version;
  const validUntil = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  const rolesToAttest: Role[] = verifyAllEcmr
    ? ['logistician', 'carrier', 'customs']
    : [role];

  for (const r of rolesToAttest) {
    const existing = next.passport.attestations.find(
      (a) => a.role === r && a.version === version
    );
    if (existing) {
      existing.decision = decision;
      existing.status = 'active';
      existing.valid_until = validUntil;
    } else {
      next.passport.attestations.push({
        role: r,
        version,
        decision,
        status: 'active',
        valid_until: validUntil,
      });
    }
  }

  const active = next.passport.attestations.filter(
    (a) => a.version === version && a.status === 'active'
  );
  const hasRejection = active.some((a) => a.decision === 'rejected');
  const allRolesApproved = ['logistician', 'carrier', 'customs'].every((req) =>
    active.some((a) => a.role === req && a.decision === 'approved')
  );

  next.passport.status = hasRejection
    ? 'blocked'
    : allRolesApproved
      ? 'ready'
      : 'collecting';

  next.updated_at = new Date().toISOString();
  next.timeline.push({
    id: `evt_att_${Date.now()}`,
    occurred_at: new Date().toISOString(),
    actor: role,
    title:
      decision === 'approved'
        ? `Таможенный pre-clearance e-CMR верифицирован для v${version}`
        : `Отклонено согласование роли ${role} для v${version}`,
    passport_version: version,
  });

  return next;
}
