'use client';

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity } from 'lucide-react';
import { CASPIAN_WEATHER_SERIES } from '@/data/caspianSnapshots';
import type { Shipment } from '@/shared/api/caspian';
import { formatMskDateTime } from '@/shared/lib/formatters';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import styles from './PredictiveChart.module.css';

interface PredictiveChartProps {
  shipment: Shipment;
  stormActive: boolean;
}

export function PredictiveChart({ shipment, stormActive }: PredictiveChartProps) {
  const { forecast } = shipment;
  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.titleWrap}>
            <Activity className={styles.icon} />
            <CardTitle>Погода Каспия (Open-Meteo, 24 ч)</CardTitle>
          </span>
          <Badge variant={stormActive ? 'destructive' : 'secondary'}>
            {forecast.quality === 'missing' ? 'Нет данных' : stormActive ? 'Шторм' : 'Штатно'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={styles.content}>
        <div className={styles.chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={CASPIAN_WEATHER_SERIES} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" interval={5} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 45]} />
              <YAxis yAxisId="right" orientation="right" hide domain={[0, 5]} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', fontSize: 11, borderRadius: 6 }} />
              <Area yAxisId="left" type="monotone" dataKey="windGusts" name="Порывы (км/ч)" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.18} strokeWidth={2} />
              <Bar yAxisId="right" dataKey="waveHeight" name="Волна (м)" fill={stormActive ? 'var(--chart-4)' : 'var(--chart-3)'} radius={[2, 2, 0, 0]} barSize={6} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.legend}>
          <span>P10–P90: {formatMskDateTime(forecast.ready_at.p10)} — {formatMskDateTime(forecast.ready_at.p90)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
