'use client';

import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import type { Operation, Shipment } from '@/shared/api/caspian';
import { formatMskDateTime, formatProbability } from '@/shared/lib/formatters';
import { Badge, Button, Card, CardContent, PixelMarker } from '@/shared/ui';
import { RouteOptionRow } from '../RouteOptionRow';
import styles from './RouteDecisionOverlay.module.css';

interface RouteDecisionOverlayProps {
  shipment: Shipment;
  activeOperation: Operation | null;
  operationTimedOut: boolean;
  errorBanner: string | null;
  isBusy: boolean;
  onSelectRoute: (routeId: string) => void;
  onRecheckOperation: () => void;
}

export function RouteDecisionOverlay({ shipment, activeOperation, operationTimedOut, errorBanner, isBusy, onSelectRoute, onRecheckOperation }: RouteDecisionOverlayProps) {
  const { forecast, routes, selected_route_id, allowed_actions } = shipment;
  const canSelect = allowed_actions.includes('select_route') && !isBusy;
  const probVariant = forecast.miss_probability === null ? 'warning' : forecast.miss_probability >= 0.5 ? 'destructive' : 'success';

  return (
    <Card className={styles.overlayCard}>
      <CardContent className={styles.content}>
        <div className={styles.headerRow}>
          <span className={styles.titleWrap}>
            <PixelMarker variant="ai" />
            <Sparkles className={styles.aiIcon} />
            <span className={styles.title}>Прогноз и выбор маршрута</span>
          </span>
          <div className={styles.badges}>
            <Badge variant={forecast.quality === 'missing' ? 'warning' : 'lavender'} className={styles.collageBadge}>
              {forecast.quality === 'missing' ? 'Нет данных' : 'Синтетический'}
            </Badge>
            <Badge variant={probVariant} className={styles.collageBadge}>Срыв: {formatProbability(forecast.miss_probability)}</Badge>
          </div>
        </div>
        <div className={styles.metaRow}>
          <span>Готовность P50: {formatMskDateTime(forecast.ready_at.p50)}</span>
          <span>Cutoff: {formatMskDateTime(forecast.cargo_cutoff)}</span>
        </div>
        {forecast.reasons[0] && <p className={styles.reason}>{forecast.reasons[0]}</p>}
        {errorBanner && <div className={styles.errorBox}>{errorBanner}</div>}
        {activeOperation && (
          <div className={styles.opBox}>
            <Loader2 className={styles.spinIcon} />
            <span>{operationTimedOut ? 'Проверяем выполнение' : `Операция (${activeOperation.status})`}</span>
            {operationTimedOut && <Button type="button" size="sm" variant="outline" onClick={onRecheckOperation}><RefreshCw className={styles.miniIcon} /> Повторить</Button>}
          </div>
        )}
        <div className={styles.routesList}>
          {routes.map((route) => <RouteOptionRow key={route.id} route={route} isSelected={route.id === selected_route_id} canSelect={canSelect} onSelect={onSelectRoute} />)}
        </div>
      </CardContent>
    </Card>
  );
}
