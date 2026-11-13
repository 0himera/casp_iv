'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownUp, Loader2, Route, X } from 'lucide-react';
import type { CaspianPort } from '@/entities/cargo';
import { API_BASE_URL } from '@/entities/shipment';
import { createCaspianClient, type JourneyPreview, type Role, type Shipment } from '@/shared/api/caspian';
import styles from './JourneyPlanner.module.css';

export function JourneyPlanner({ shipment, ports, role, isBusy, onPreview, onSave }: {
  shipment: Shipment; ports: CaspianPort[]; role: Role; isBusy: boolean;
  onPreview: (preview: JourneyPreview | null) => void;
  onSave?: (origin: string, destination: string) => void;
}) {
  const [origin, setOrigin] = useState(ports.some((p) => p.id === shipment.origin.id) ? shipment.origin.id : '');
  const [destination, setDestination] = useState(shipment.destination.id);
  const [exploring, setExploring] = useState(false);
  const client = createCaspianClient(API_BASE_URL, () => role);
  const same = origin === destination;
  const query = useQuery({
    queryKey: ['marine-route', origin, destination],
    queryFn: () => client.previewJourney(origin, destination),
    enabled: exploring && Boolean(origin && destination) && !same,
    staleTime: Infinity, retry: false,
  });
  const preview = exploring && !same ? query.data : undefined;
  useEffect(() => { onPreview(preview ?? null); }, [preview, onPreview]);
  useEffect(() => () => onPreview(null), [onPreview]);
  const unchanged = origin === shipment.origin.id && destination === shipment.destination.id && shipment.routes.every((r) => r.modes.length === 1 && r.modes[0] === 'sea');
  const canSave = role === 'logistician' && shipment.allowed_actions.includes('select_route') && !isBusy && !unchanged;
  const options = [...ports].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  return <section className={styles.planner} aria-label="Построение морского маршрута">
    <div className={styles.heading}><Route size={16} /><strong>Из порта в порт</strong>{exploring && <button type="button" aria-label="Закрыть предпросмотр маршрута" onClick={() => setExploring(false)}><X size={16} /></button>}</div>
    <div className={styles.fields}>
      <label>Откуда<select aria-label="Порт отправления" disabled={isBusy} value={origin} onChange={(e) => { setOrigin(e.target.value); setExploring(true); }}><option value="">Выберите порт</option>{options.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <button type="button" className={styles.swap} aria-label="Поменять порты местами" disabled={!origin || !destination || isBusy} onClick={() => { setOrigin(destination); setDestination(origin); setExploring(true); }}><ArrowDownUp size={17} /></button>
      <label>Куда<select aria-label="Порт назначения" disabled={isBusy} value={destination} onChange={(e) => { setDestination(e.target.value); setExploring(true); }}><option value="">Выберите порт</option>{options.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    </div>
    {!exploring && <p>Выберите порты — морской путь появится на карте. Текущая отправка изменится после сохранения.</p>}
    {exploring && same && <p role="alert" className={styles.error}>Выберите разные порты.</p>}
    {exploring && query.isFetching && !same && <p role="status"><Loader2 size={13} className={styles.spin} /> Строим морской путь…</p>}
    {exploring && query.isError && !same && <p role="alert" className={styles.error}>{query.error.message}</p>}
    {preview && <>
      <div className={styles.metrics}><strong>{Math.round(preview.sea_distance_km).toLocaleString('ru-RU')} км по морю</strong><span>+ ≈{Math.round(preview.approach_gap_km)} км подходов</span></div>
      <p>Предпросмотр · рейс и места не подтверждены. Подходы к портам на линии не показаны.</p>
      {preview.warnings.filter((w) => w.startsWith('Речной')).map((w) => <p key={w} className={styles.warning}>{w}</p>)}
      <button type="button" className={styles.save} disabled={!canSave} onClick={() => onSave?.(origin, destination)}>{isBusy ? 'Расчёт и запись…' : unchanged ? 'Этот маршрут уже выбран' : 'Сохранить маршрут'}</button>
      <p>{role !== 'logistician' ? 'Сохранять направление может логист.' : 'Обновим отправление, назначение, прогноз и ESG. Новая версия паспорта потребует повторных согласований.'}</p>
    </>}
  </section>;
}
