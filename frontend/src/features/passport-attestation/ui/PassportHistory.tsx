'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Download } from 'lucide-react';
import { API_BASE_URL, getRoleLabel } from '@/entities/shipment';
import { createCaspianClient, type Role, type Shipment } from '@/shared/api/caspian';
import { formatMskDateTime } from '@/shared/lib/formatters';
import styles from './passport-read.module.css';

function saveJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const eventNames: Record<string, string> = { create: 'Паспорт создан', select_route: 'Маршрут изменён', replace_document: 'Документ обновлён', attest: 'Решение роли записано', revoke: 'Согласование отозвано' };

export function PassportHistory({ shipment, role }: { shipment: Shipment; role: Role }) {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(shipment.passport.version);
  const client = createCaspianClient(API_BASE_URL, () => role);
  const query = useQuery({ queryKey: ['passport-history', shipment.id, version, role, shipment.revision], queryFn: () => client.getPassportVersion(shipment.id, version), enabled: open && version > 0, retry: false });
  const archived = query.data?.shipment;
  return <section className={styles.section} aria-label="История паспорта">
    <div className={styles.heading}><History size={17} />Версии и события</div>
    <button className={styles.button} onClick={() => setOpen((v) => !v)} aria-expanded={open}>{open ? 'Скрыть архив' : 'Открыть архив версий'}</button>
    {open && <>
      <div className={styles.controls}><label>Версия <select aria-label="Версия паспорта" value={version} onChange={(e) => setVersion(Number(e.target.value))}>{Array.from({ length: shipment.passport.version }, (_, i) => shipment.passport.version - i).map((v) => <option key={v} value={v}>v{v}</option>)}</select></label></div>
      {query.isFetching && <p className={styles.note}>Загружаем подтверждённую версию…</p>}
      {query.isError && <p role="alert" className={styles.error}>{query.error.message} <button className={styles.button} onClick={() => void query.refetch()}>Повторить</button></p>}
      {!query.isFetching && !query.isError && archived && <div className={styles.result}>
        <strong>Архивный снимок v{archived.passport.version}</strong>
        <p className={styles.note}>Состояние на момент записи; сроки согласований могли истечь.</p>
        <span>{archived.routes.find((r) => r.id === archived.selected_route_id)?.name ?? archived.selected_route_id}</span>
        {archived.documents.map((doc) => <p className={styles.note} key={doc.id}>{doc.filename} · документ v{doc.version}</p>)}
        <button className={styles.button} onClick={() => saveJson(query.data, `passport-${shipment.id}-v${version}.json`)}><Download size={15} />Снимок и доказательство · JSON</button>
      </div>}
    </>}
    <details className={styles.details}><summary>Журнал событий · {shipment.timeline.length}</summary><ol className={styles.timeline}>{[...shipment.timeline].reverse().map((event) => <li key={event.id} className={styles.event}><strong>{eventNames[event.title.split(':')[0]] ?? event.title} · v{event.passport_version}</strong><span className={styles.note}>{['logistician', 'carrier', 'customs'].includes(event.actor) ? getRoleLabel(event.actor as Role) : event.actor}</span><br /><time dateTime={event.occurred_at}>{formatMskDateTime(event.occurred_at)}</time></li>)}</ol></details>
  </section>;
}
