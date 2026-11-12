'use client';

import { useState } from 'react';
import { useLiveOverview } from '@/entities/cargo';
import { findConnections } from '../../model/corridorNetwork';
import { useCorridors } from '../../model/useCorridors';
import styles from './CorridorExplorer.module.css';

export function CorridorExplorer({ onClose, onHighlight }: { onClose: () => void; onHighlight: (ids: string[]) => void }) {
  const live = useLiveOverview();
  const network = useCorridors();
  const [from, setFrom] = useState('aktau');
  const [to, setTo] = useState('amirabad');
  const ports = live.data?.items.map((item) => item.port) ?? [];
  const name = (id: string) => ports.find((p) => p.id === id)?.name ?? id;
  const edges = network.data?.items ?? [];
  const paths = findConnections(edges, from, to);
  const shown = paths.length ? paths : [];
  return <section className={styles.panel} aria-label="Сеть портов">
    <div className={styles.header}><h3>Связи между портами · {edges.length}</h3><button onClick={onClose} aria-label="Закрыть сеть портов">✕</button></div>
    <p className={styles.note}>Публикации о направлениях, включая исторические линии и планы. Работа рейса, пересадка и места сейчас не подтверждены.</p>
    <div className={styles.fields}>
      <label>Откуда<select aria-label="Порт отправления" value={from} onChange={(e) => { setFrom(e.target.value); onHighlight([]); }}>{ports.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Куда<select aria-label="Порт назначения" value={to} onChange={(e) => { setTo(e.target.value); onHighlight([]); }}>{ports.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    </div>
    {network.isError ? <p>Не удалось загрузить каталог направлений.</p> : !network.data ? <p>Загрузка сети…</p> : shown.length ? shown.map((path, i) => {
      let current = from;
      const names = [name(current)];
      for (const edge of path) { current = edge.port_ids.find((id) => id !== current)!; names.push(name(current)); }
      return <div className={styles.item} key={path.map((e) => e.id).join(':')}>
        <strong>{names.join(' → ')}</strong>
        {path.length > 1 && <p className={styles.note}>Связность каталога; возможность пересадки не проверена.</p>}
        <p className={styles.note}>Путь по маске воды. ETA, цена и бронь: нет данных.</p>
        <button onClick={() => onHighlight(path.map((e) => e.id))}>Выделить связь {i + 1}</button>
        {path.map((edge) => <a key={edge.id} href={edge.source_url} target="_blank" rel="noreferrer">Источник: {edge.port_ids.map(name).join(' — ')}</a>)}
      </div>;
    }) : <p className={styles.note}>Для этой пары в каталоге нет связи до трёх переходов. Это не означает, что перевозка невозможна.</p>}
    <details><summary>Все опубликованные направления ({edges.length})</summary>{edges.map((edge) => <div key={edge.id} className={styles.item}><strong>{edge.port_ids.map(name).join(' ↔ ')}</strong><p className={styles.note}>{edge.evidence}</p><button onClick={() => onHighlight([edge.id])}>Выделить</button><a href={edge.source_url} target="_blank" rel="noreferrer">Источник</a></div>)}</details>
    <p className={styles.note}>Морские линии обходят сушу по Natural Earth. Портовые и речные подходы не рассчитаны; линия может начинаться в море. Без координат или водного пути линия скрыта. Два варианта в карточке груза — отдельные сценарии; просмотр сети их не меняет.</p>
  </section>;
}
