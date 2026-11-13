'use client';

import { Anchor, ArrowRight, Ship, ShieldCheck, Train, Truck } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { getPassportStatusLabel } from '@/entities/shipment';
import { formatMskDateTime } from '@/shared/lib/formatters';
import { Badge } from '@/shared/ui';
import styles from './CommandCenterPage.module.css';

export function WorkspaceSummary({ shipment }: { shipment: Shipment }) {
  const route = shipment.routes.find((r) => r.id === shipment.selected_route_id);
  const rail = route?.modes.includes('rail');
  const LandIcon = rail ? Train : Truck;
  const status = shipment.passport.status;
  return <>
    <section className={styles.summaryCard} aria-label="Плечи маршрута">
      <h3>Плечи маршрута</h3>
      <div className={styles.chain}><span><LandIcon size={21} />{rail ? 'Ж/д' : 'Авто'}</span><ArrowRight size={16} /><span><Anchor size={21} />Порт</span><ArrowRight size={16} /><span><Ship size={21} />Море</span></div>
      <p>{route?.name ?? 'Маршрут не выбран'}</p>
      <dl><dt>Готовность P50</dt><dd>{formatMskDateTime(shipment.forecast.ready_at.p50)}</dd><dt>Cutoff парома</dt><dd>{formatMskDateTime(shipment.forecast.cargo_cutoff)}</dd></dl>
      <a href="#route-section">Условия и прогноз <ArrowRight size={14} /></a>
    </section>
    <section className={styles.summaryCard} aria-label="Состояние паспорта">
      <h3>Паспорт груза <span>v{shipment.passport.version}</span></h3>
      <Badge variant={status === 'ready' ? 'success' : status === 'blocked' ? 'destructive' : 'warning'}>{getPassportStatusLabel(status)}</Badge>
      <p>Логист · Перевозчик · Таможня</p>
      <p className={styles.note}>Согласование версии документов участниками. Таможенная роль имитируется.</p>
      <a href="#ledger-section"><ShieldCheck size={16} /> Casper testnet <ArrowRight size={14} /></a>
    </section>
  </>;
}
