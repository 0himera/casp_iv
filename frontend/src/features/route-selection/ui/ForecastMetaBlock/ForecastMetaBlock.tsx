'use client';

import { Sparkles } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { formatMskDateTime, formatProbability } from '@/shared/lib/formatters';
import { Badge, PixelMarker } from '@/shared/ui';
import styles from './ForecastMetaBlock.module.css';

interface ForecastMetaBlockProps {
  forecast: Shipment['forecast'];
}

export function ForecastMetaBlock({ forecast }: ForecastMetaBlockProps) {
  const probVariant = forecast.miss_probability === null
    ? 'warning'
    : forecast.miss_probability >= 0.5 ? 'destructive' : 'success';

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <span className={styles.titleWrap}>
          <PixelMarker variant="ai" />
          <Sparkles className={styles.aiIcon} />
          <span className={styles.title}>Прогноз и выбор маршрута</span>
        </span>
        <div className={styles.badges}>
          <Badge variant={forecast.quality === 'missing' ? 'warning' : 'lavender'}>
            {forecast.quality === 'missing' ? 'Нет данных' : forecast.quality === 'synthetic' ? 'Демо / сценарий' : forecast.method === 'ml' ? 'ML-модель' : 'Прогноз'}
          </Badge>
          <Badge variant={probVariant}>
            Срыв: {formatProbability(forecast.miss_probability)}
          </Badge>
        </div>
      </div>
      <div className={styles.metaRow}>
        <span>Готовность P50: {formatMskDateTime(forecast.ready_at.p50)}</span>
        <span>Cutoff: {formatMskDateTime(forecast.cargo_cutoff)}</span>
        <span>Действует до: {formatMskDateTime(forecast.valid_until)}</span>
      </div>
      {forecast.reasons.map((reason) => <p key={reason} className={styles.reason}>{reason}</p>)}
    </div>
  );
}
