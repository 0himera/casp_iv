'use client';

import { Anchor, ArrowRight, Check, X } from 'lucide-react';
import type { CaspianPort } from '@/entities/cargo';
import type { Shipment } from '@/shared/api/caspian';
import { Button, ViewfinderFrame } from '@/shared/ui';
import styles from './PortInspectionCard.module.css';

interface PortInspectionCardProps { port: CaspianPort; shipment: Shipment; isBusy?: boolean; onSelectRoute?: (routeId: string) => void; onClose: () => void; }

export function PortInspectionCard({ port, shipment, isBusy, onSelectRoute, onClose }: PortInspectionCardProps) {
  const activeRoute = shipment.routes.find((r) => r.id === shipment.selected_route_id);
  const isInActive = activeRoute?.ports.includes(port.name) || activeRoute?.ports.includes(port.id);
  const portRoute = shipment.routes.find((r) => r.ports.includes(port.name) || r.ports.includes(port.id));
  const live = port.live;
  return (
    <ViewfinderFrame stamp="[ 04-PORT / INSPECTION ]" className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleWrap}><Anchor className={styles.icon} /><div>
          <h4 className={styles.name}>{port.name}</h4>
          <span className={styles.meta}>{port.country} · {port.lat.toFixed(2)}°N, {port.lng.toFixed(2)}°E</span>
        </div></div>
        <button type="button" aria-label="Закрыть" onClick={onClose} className={styles.closeBtn}><X className={styles.closeIcon} /></button>
      </div>
      {live ? <>
        <div className={styles.grid}>
          <div className={styles.metric}><span className={styles.k}>Ветер · прогноз</span><span className={styles.v}>{live.windSpeed === null ? 'Нет данных' : `${live.windSpeed} км/ч`}</span></div>
          <div className={styles.metric}><span className={styles.k}>Порывы</span><span className={styles.v}>{live.windGusts === null ? 'Нет данных' : `${live.windGusts} км/ч`}</span></div>
          <div className={styles.metric}><span className={styles.k}>Судозаходы / день</span><span className={styles.v}>{live.portCalls ?? 'Нет данных'}</span></div>
          <div className={styles.metric}><span className={styles.k}>Причалы · демо</span><span className={styles.v}>{live.demoMetricsAvailable ? `${port.berthsAvailable}/${port.totalBerths}` : 'Нет данных'}</span></div>
          <div className={styles.metric}><span className={styles.k}>Волна · демо</span><span className={styles.v}>{live.demoMetricsAvailable ? `${port.waveHeightM} м` : 'Нет данных'}</span></div>
        </div>
        <p className={styles.meta}>{live.weatherAt ? `Погода: ${new Date(live.weatherAt).toLocaleString('ru-RU')} · Open-Meteo${live.weatherStale ? ' · устарело' : ''}` : 'Прогноз погоды недоступен'}</p>
        <p className={styles.meta}>{live.activityDate ? `Судозаходы: ${live.activityDate} · PortWatch${live.activityStale ? ' · устарело' : ''}` : 'Данные о судозаходах недоступны'}</p>
        <p className={styles.meta}>{live.sailingAvailable ? `Диспозиция: ${live.sailings.length} судов · не бронь` : 'Диспозиция недоступна'}</p>
        {live.sailings.slice(0, 5).map((s, i) => <p className={styles.meta} key={`${s.name}-${i}`}>{s.name} · {s.status || s.category}</p>)}
        {live.sailingSources.map((s) => <p className={styles.meta} key={s.url}><a href={s.url} target="_blank" rel="noreferrer">Источник диспозиции · {s.date}{s.stale ? ' · устарело' : ''}</a></p>)}
        {live.weatherSource && <p className={styles.meta}><a href={live.weatherSource} target="_blank" rel="noreferrer">Источник прогноза погоды</a></p>}
        {live.activitySource && <p className={styles.meta}><a href={live.activitySource} target="_blank" rel="noreferrer">Источник судозаходов</a></p>}
      </> : <>
        <p className={styles.meta}>Демонстрационные данные порта — источник недоступен.</p>
        <div className={styles.grid}>
          <div className={styles.metric}><span className={styles.k}>Волна</span><span className={styles.v}>{port.waveHeightM} м</span></div>
          <div className={styles.metric}><span className={styles.k}>Ветер</span><span className={styles.v}>{port.windSpeedKmh} км/ч</span></div>
          <div className={styles.metric}><span className={styles.k}>Причалы</span><span className={styles.v}>{port.berthsAvailable}/{port.totalBerths}</span></div>
          <div className={styles.metric}><span className={styles.k}>На рейде</span><span className={styles.v}>{port.vesselsInRoadstead} суд.</span></div>
        </div>
      </>}
      {isInActive && <div className={styles.statusRow}><Check className={styles.checkIcon} /><span>Включён в текущий маршрут</span></div>}
      {!isInActive && portRoute && <Button type="button" size="sm" disabled={isBusy || !shipment.allowed_actions.includes('select_route') || !portRoute.feasible} onClick={() => onSelectRoute?.(portRoute.id)} className={styles.routeBtn}>{isBusy ? 'Перестроение...' : `Маршрут через ${port.name}`} <ArrowRight className={styles.arrowIcon} /></Button>}
    </ViewfinderFrame>
  );
}
