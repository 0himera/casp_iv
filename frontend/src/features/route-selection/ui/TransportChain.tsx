'use client';

import { Anchor, Ship, Train, Truck } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { formatMskDateTime } from '@/shared/lib/formatters';
import styles from './TransportChain.module.css';

export function TransportChain({ shipment }: { shipment: Shipment }) {
  const route = shipment.routes.find((r) => r.id === shipment.selected_route_id)!;
  const input = shipment.planning?.inputs.find((r) => r.route_id === route.id);
  const marineOnly = route.modes.length === 1 && route.modes[0] === 'sea';
  const rail = route.modes.includes('rail');
  const delay = rail ? shipment.planning?.assumptions.rail_delay_hours : shipment.planning?.assumptions.road_delay_hours;
  const Icon = rail ? Train : Truck;
  return <section className={styles.frame} aria-label="Мультимодальная цепочка">
    <strong>Стыковка транспорта · {marineOnly ? 'Порт → море → порт' : rail ? 'Ж/д → порт → море' : 'Авто → порт → море'}</strong>
    <div className={styles.steps}>
      {!marineOnly && <div className={styles.step}><Icon size={18} /><strong>{rail ? 'Ж/д до порта' : 'Авто до порта'}</strong>
        <span>{shipment.current_location.name} → {route.ports[0]}</span>
        <span>{input ? `${input.land_hours} ч в пути, включая задержку ${delay ?? 0} ч` : 'Время требует пересчёта'}</span>
      </div>}
      <div className={styles.step}><Anchor size={18} /><strong>Перегрузка в порту</strong>
        <span>{input ? `Очередь и обработка: ${input.terminal_hours} ч` : 'Нет расчёта обработки'}</span>
        <span>Готовность P50: {formatMskDateTime(shipment.forecast.ready_at.p50)}</span>
      </div>
      <div className={styles.step}><Ship size={18} /><strong>Паром → {shipment.destination.name}</strong>
        <span>Cutoff: {formatMskDateTime(shipment.forecast.cargo_cutoff)}</span>
        <span>Доставка P50: {formatMskDateTime(route.eta.p50)}</span>
      </div>
    </div>
    <p>{marineOnly ? 'Морская перевозка без сухопутного плеча. Подходы к портам оценены приближённо; расписание и длительности — параметры сценария.' : 'Сравниваем ж/д + море и авто + море. Задержка на суше меняет риск пропустить паром; ESG учитывает вид транспорта. Длительности и расписание — параметры сценария.'}</p>
  </section>;
}
