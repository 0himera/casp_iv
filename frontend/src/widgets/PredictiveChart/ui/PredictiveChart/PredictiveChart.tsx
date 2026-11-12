'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CASPIAN_WEATHER_SERIES } from '@/data/caspianSnapshots';
import type { Shipment } from '@/shared/api/caspian';
import { formatMskDateTime } from '@/shared/lib/formatters';
import { Badge, PixelMarker, ViewfinderFrame } from '@/shared/ui';
import styles from './PredictiveChart.module.css';

interface PredictiveChartProps {
  shipment: Shipment;
  stormActive: boolean;
}

export function PredictiveChart({ shipment, stormActive }: PredictiveChartProps) {
  const { forecast } = shipment;
  const waveColor = stormActive ? 'var(--chart-4)' : 'var(--chart-1)';
  return (
    <ViewfinderFrame stamp="✦ TELEMETRY // 24H" className={styles.card}>
      <div className={styles.titleRow}>
        <span className={styles.titleWrap}>
          <PixelMarker variant={stormActive ? 'alert' : 'ai'} />
          <h3 className={styles.heading}>Предиктивный <em className={styles.headingItalic}>прогноз</em></h3>
        </span>
        <Badge variant={stormActive ? 'destructive' : 'lavender'}>
          {forecast.quality === 'missing' ? 'Нет данных' : stormActive ? 'Шторм' : 'Штатно'}
        </Badge>
      </div>
      <div className={styles.chartBox}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={CASPIAN_WEATHER_SERIES} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="gustGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.22} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={waveColor} stopOpacity={0.22} />
                <stop offset="95%" stopColor={waveColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="hour" interval={5} tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 45]} />
            <YAxis yAxisId="right" orientation="right" hide domain={[0, 4]} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', fontSize: 11, borderRadius: 6 }} />
            <Area yAxisId="left" type="monotone" dataKey="windGusts" name="Порывы (км/ч)" stroke="var(--chart-2)" fill="url(#gustGrad)" strokeWidth={1.5} />
            <Area yAxisId="right" type="monotone" dataKey="waveHeight" name="Волна (м)" stroke={waveColor} fill="url(#waveGrad)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.legend}>
        <span>P10–P90: {formatMskDateTime(forecast.ready_at.p10)} — {formatMskDateTime(forecast.ready_at.p90)}</span>
      </div>
    </ViewfinderFrame>
  );
}
