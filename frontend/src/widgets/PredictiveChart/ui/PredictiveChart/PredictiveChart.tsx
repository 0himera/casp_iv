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
import type { ForecastPoint } from '@/entities/cargo';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import styles from './PredictiveChart.module.css';

interface PredictiveChartProps {
  forecast: ForecastPoint[];
  stormActive: boolean;
}

export function PredictiveChart({ forecast, stormActive }: PredictiveChartProps) {
  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.titleWrap}>
            <Activity className={styles.icon} />
            <CardTitle>Прогноз задержек и загрузки (7 дн)</CardTitle>
          </div>
          <Badge variant={stormActive ? 'destructive' : 'secondary'}>
            {stormActive ? 'Шторм фактор' : 'Штатный режим'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={styles.content}>
        <div className={styles.chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecast} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" hide domain={[0, 30]} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', fontSize: 11, borderRadius: 6 }} />
              <Area yAxisId="left" type="monotone" dataKey="portLoad" name="Загрузка (%)" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.18} strokeWidth={2} />
              <Bar yAxisId="right" dataKey="predictedDelay" name="Задержка (ч)" fill={stormActive ? 'var(--chart-4)' : 'var(--chart-3)'} radius={[3, 3, 0, 0]} barSize={14} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.legend}>
          <span><i className={`${styles.dot} ${styles.loadDot}`} /> Загрузка причалов (%)</span>
          <span><i className={`${styles.dot} ${stormActive ? styles.stormDot : styles.delayDot}`} /> Прогноз задержки (ч)</span>
        </div>
      </CardContent>
    </Card>
  );
}

