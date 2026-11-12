import type { ScenarioRequest, Shipment } from '@/shared/api/caspian';

export function applyScenarioTransition(
  shipment: Shipment,
  scenario: ScenarioRequest['scenario']
): Shipment {
  const next = structuredClone(shipment);
  const isStorm = scenario === 'storm';

  if (isStorm) {
    next.routes[0].miss_probability = 0.84;
    next.routes[0].eta = {
      p10: '2026-11-17T06:00:00Z',
      p50: '2026-11-17T08:00:00Z',
      p90: '2026-11-17T12:00:00Z',
    };
    next.routes[1].miss_probability = 0.22;
    next.forecast.ready_at = {
      p10: '2026-11-13T11:00:00Z',
      p50: '2026-11-13T16:00:00Z',
      p90: '2026-11-14T02:00:00Z',
    };
    next.forecast.reasons = [
      'Штормовой фронт в районе Энзели (волны 3.8м, ветер 62 км/ч, риск 84%). Рекомендуется обход через Амирабад.',
    ];
  } else {
    next.routes[0].miss_probability = 0.16;
    next.routes[1].miss_probability = 0.22;
    next.forecast.ready_at = {
      p10: '2026-11-13T06:00:00Z',
      p50: '2026-11-13T08:00:00Z',
      p90: '2026-11-13T12:00:00Z',
    };
    next.forecast.reasons = [
      'Запас до закрытия приёма груза — 3 часа по медианному сценарию',
    ];
  }

  const selected = next.routes.find((r) => r.id === next.selected_route_id);
  next.forecast.miss_probability = selected?.miss_probability ?? (isStorm ? 0.84 : 0.16);
  next.updated_at = new Date().toISOString();

  next.timeline.push({
    id: `evt_scen_${Date.now()}`,
    occurred_at: new Date().toISOString(),
    actor: 'system',
    title: isStorm
      ? 'Обнаружен штормовой фронт на юге Каспия. Риск задержки: 84%'
      : 'Штормовое предупреждение снято. Штатный режим коридора.',
    passport_version: next.passport.version,
  });

  return next;
}
