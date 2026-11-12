'use client';

import { useState } from 'react';
import type { PlanningAssumptions, Shipment } from '@/shared/api/caspian';
import { Button } from '@/shared/ui';
import styles from './PlanningControls.module.css';

const defaults: PlanningAssumptions = {
  terminal_hours: 8, rail_delay_hours: 0, road_delay_hours: 0, wind_limit_kmh: 40,
  cutoff_in_hours: 24, sailing_interval_hours: 24, assume_capacity: true,
  rail_kg_per_tonne_km: 0.022, road_kg_per_tonne_km: 0.062, sea_kg_per_tonne_km: 0.015,
};
const fields = [
  ['terminal_hours', 'Очередь и обработка, ч', 0, 72],
  ['rail_delay_hours', 'Задержка ж/д, ч', 0, 72],
  ['road_delay_hours', 'Задержка авто, ч', 0, 72],
  ['wind_limit_kmh', 'Сценарный порог ветра, км/ч', 1, 150],
  ['cutoff_in_hours', 'Базовый cutoff, ч', 2, 96],
  ['sailing_interval_hours', 'Интервал условных рейсов, ч', 6, 72],
  ['rail_kg_per_tonne_km', 'Ж/д, кг CO₂e/(т·км)', 0, 10],
  ['road_kg_per_tonne_km', 'Авто, кг CO₂e/(т·км)', 0, 10],
  ['sea_kg_per_tonne_km', 'Море, кг CO₂e/(т·км)', 0, 10],
] as const;

export function PlanningControls({ shipment, isBusy, onCalculate }: {
  shipment: Shipment; isBusy: boolean; onCalculate: (value: PlanningAssumptions) => void;
}) {
  const [draft, setDraft] = useState<PlanningAssumptions>({ ...defaults, ...shipment.planning?.assumptions });
  return <section className={styles.frame} aria-label="Условия расчёта">
    <p>{shipment.planning ? 'Расчёт на сервере: погода + сценарные условия.' : 'Пересчитайте прогноз, чтобы заменить демонстрационные числа расчётом.'}</p>
    <details><summary>Допущения и источники расчёта</summary>
      <form onSubmit={(e) => { e.preventDefault(); onCalculate(draft); }}>
        <div className={styles.grid}>{fields.map(([key, label, min, max]) => <label key={key}>{label}
          <input type="number" min={min} max={max} step="any" required value={draft[key] ?? defaults[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.valueAsNumber })} />
        </label>)}</div>
        <label><input type="checkbox" checked={draft.assume_capacity ?? true} onChange={(e) => setDraft({ ...draft, assume_capacity: e.target.checked })} /> Допустить места на условных рейсах; фактическая вместимость не подтверждена</label>
        <p>Условные cutoff: базовый для Астрахани; Махачкала +12 ч, Актау +36 ч, Туркменбаши +60 ч. Это не расписание оператора. Без допущения мест ETA доставки не определяется. Порог ветра — параметр сценария, не норматив допуска судна.</p>
        <Button type="submit" size="sm" disabled={isBusy || !shipment.allowed_actions.includes('run_scenario')}>Применить условия</Button>
      </form>
      {shipment.planning && <><p>{shipment.planning.note}</p>{shipment.planning.inputs.map((input) => <p key={input.route_id}>
        {shipment.routes.find((r) => r.id === input.route_id)?.name}: ветер {input.wind_max_kmh ?? 'нет данных'} км/ч · {input.weather_status} · задержка по погоде {input.weather_hold_hours} ч.
        {' '}Судозаходы: {input.port_calls ?? 'нет данных'} за {input.activity_date ?? '—'}; медиана {input.median_port_calls ?? '—'}; множитель очереди {input.queue_factor}. Cutoff: {new Date(input.cutoff_at).toLocaleString('ru-RU')}.
        {' '}{input.activity_source_url && <a href={input.activity_source_url} target="_blank" rel="noreferrer">Активность ({input.activity_stale ? 'устарела' : 'свежая'})</a>} · {input.weather_source_url && <a href={input.weather_source_url} target="_blank" rel="noreferrer">Погода</a>} · получена {input.weather_fetched_at ? new Date(input.weather_fetched_at).toLocaleString('ru-RU') : '—'}.
      </p>)}</>}
    </details>
    <Button type="button" size="sm" disabled={isBusy || !shipment.allowed_actions.includes('run_scenario')} onClick={() => onCalculate(draft)}>{isBusy ? 'Ожидание ответа…' : 'Пересчитать прогноз'}</Button>
  </section>;
}
