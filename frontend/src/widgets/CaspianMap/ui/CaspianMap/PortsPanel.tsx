import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { CaspianPort } from '@/entities/cargo';
import { CorridorExplorer } from '../CorridorExplorer';
import styles from './CaspianMap.module.css';

export function PortsPanel({ ports, onSelect, onHighlight }: { ports: CaspianPort[]; onSelect: (port: CaspianPort) => void; onHighlight: (ids: string[]) => void }) {
  const [network, setNetwork] = useState(false);
  const [query, setQuery] = useState('');
  if (network) return <CorridorExplorer onClose={() => { setNetwork(false); onHighlight([]); }} onHighlight={onHighlight} />;
  const filtered = ports.filter((p) => `${p.name} ${p.country}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <div className={styles.portList}>
    <p className={styles.note}>Погода и опубликованные данные портов. Наличие рейса и свободных мест требуют подтверждения оператора.</p>
    <button className={styles.networkButton} onClick={() => setNetwork(true)}>Связи между портами <ArrowUpRight size={16} /></button>
    <input className={styles.search} aria-label="Поиск порта" placeholder="Порт или страна" value={query} onChange={(e) => setQuery(e.target.value)} />
    <span className={styles.note}>{filtered.length} из {ports.length} портов</span>
    {filtered.map((port) => <button className={styles.portRow} key={port.id} onClick={() => onSelect(port)}>
      <span><strong>{port.name}</strong><small>{port.country}</small></span>
      <span className={styles.portWind}>{port.live?.windSpeed != null ? `${Math.round(port.live.windSpeed)} км/ч` : 'Нет погоды'} <ArrowUpRight size={14} /></span>
    </button>)}
    {!filtered.length && <p className={styles.note}>Порты не найдены. Попробуйте другое название.</p>}
  </div>;
}
