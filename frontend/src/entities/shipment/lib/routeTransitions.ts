import type { Shipment } from '@/shared/api/caspian';

export function applyRouteSwitchTransition(
  shipment: Shipment,
  targetRouteId: string
): Shipment {
  const next = structuredClone(shipment);
  const target = next.routes.find((r) => r.id === targetRouteId) ?? next.routes[0];

  next.selected_route_id = target.id;
  next.passport.version += 1;

  for (const att of next.passport.attestations) {
    if (att.status === 'active') att.status = 'invalidated';
  }
  next.passport.status = 'collecting';
  next.passport.route_hash = `hash_${target.id}_v${next.passport.version}`;

  for (const r of next.routes) {
    r.requires_reapproval = r.id !== target.id;
  }

  if (target.id === 'route_aktau') {
    next.forecast.miss_probability = 0.12;
    next.forecast.cargo_cutoff = '2026-11-15T00:00:00Z';
    next.forecast.ready_at = { p10: '2026-11-14T10:00:00Z', p50: '2026-11-14T16:00:00Z', p90: '2026-11-15T02:00:00Z' };
    next.forecast.reasons = ['Восточный коридор через Актау (Казахстан) и Амирабад. Риск 12%, шторм Энзели обойдён.'];
  } else if (target.id === 'route_makh') {
    next.forecast.miss_probability = 0.22;
    next.forecast.cargo_cutoff = '2026-11-14T12:00:00Z';
    next.forecast.ready_at = { p10: '2026-11-14T04:00:00Z', p50: '2026-11-14T08:00:00Z', p90: '2026-11-14T15:00:00Z' };
    next.forecast.reasons = ['Маршрут перестроен через Махачкалу (-16 ч задержки, риск 22%).'];
  } else if (target.id === 'route_turkmen') {
    next.forecast.miss_probability = 0.18;
    next.forecast.cargo_cutoff = '2026-11-15T06:00:00Z';
    next.forecast.ready_at = { p10: '2026-11-14T14:00:00Z', p50: '2026-11-14T20:00:00Z', p90: '2026-11-15T08:00:00Z' };
    next.forecast.reasons = ['Юго-восточный коридор через Туркменбаши. Риск 18%.'];
  } else {
    next.forecast.miss_probability = 0.84;
    next.forecast.reasons = ['Штормовое окно в районе Энзели. Высокий риск срыва стыковки.'];
  }

  next.updated_at = new Date().toISOString();
  next.timeline.push({
    id: `evt_route_${Date.now()}`,
    occurred_at: new Date().toISOString(),
    actor: 'system',
    title: `Перестроение маршрута на ${target.name} (v${next.passport.version})`,
    passport_version: next.passport.version,
  });

  return next;
}
