'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLiveOverview } from '@/entities/cargo';
import type { Shipment } from '@/shared/api/caspian';
import { formatMskDateTime } from '@/shared/lib/formatters';
import { Badge, PixelMarker, ViewfinderFrame } from '@/shared/ui';
import styles from './PredictiveChart.module.css';

interface PredictiveChartProps { shipment: Shipment; stormActive: boolean; }

export function PredictiveChart({ shipment, stormActive }: PredictiveChartProps) {
  const query = useLiveOverview();
  const route = shipment.routes.find((r) => r.id === shipment.selected_route_id);
  const port = query.data?.items.find((item) => route?.ports.some((name) => name === item.port.id || name === item.port.name) && item.weather)
    ?? query.data?.items.find((item) => item.port.id === 'astrakhan');
  const weather = port?.weather;
  const points = weather?.hourly.map((point) => ({
    hour: point.time.slice(11, 16), time: point.time, wind: point.wind_speed_10m, gust: point.wind_gusts_10m,
  })) ?? [];
  return (
    <ViewfinderFrame stamp="Погода · прогноз" className={styles.card}>
      <div className={styles.titleRow}>
        <span className={styles.titleWrap}><PixelMarker variant={stormActive ? 'alert' : 'ai'} />
          <h3 className={styles.heading}>Ветер · <em className={styles.headingItalic}>{port?.port.name ?? 'нет данных'}</em></h3>
        </span>
        <Badge variant={weather?.meta.stale || !weather ? 'warning' : 'lavender'}>{weather ? weather.meta.stale ? 'Устарело' : 'Open-Meteo' : 'Нет данных'}</Badge>
      </div>
      <div className={styles.chartBox}>
        {points.length ? <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="hour" interval={5} tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', fontSize: 11, borderRadius: 6 }} />
            <Area type="monotone" dataKey="wind" name="Ветер (км/ч)" stroke="var(--chart-1)" fill="transparent" connectNulls={false} />
            <Area type="monotone" dataKey="gust" name="Порывы (км/ч)" stroke="var(--chart-2)" fill="transparent" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer> : <p>Прогноз погоды недоступен.</p>}
      </div>
      <div className={styles.legend}>
        <span>Часы UTC · прогноз на сетке Open-Meteo{weather ? ` · получен ${new Date(weather.meta.fetched_at).toLocaleString('ru-RU')}` : ''}</span>
        <span>Готовность груза (сценарий): {formatMskDateTime(shipment.forecast.ready_at.p10)} — {formatMskDateTime(shipment.forecast.ready_at.p90)}</span>
      </div>
    </ViewfinderFrame>
  );
}
