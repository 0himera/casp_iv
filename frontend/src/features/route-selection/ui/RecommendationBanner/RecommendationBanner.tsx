'use client';

import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Badge, Button } from '@/shared/ui';
import styles from './RecommendationBanner.module.css';

interface RecommendationBannerProps {
  stormActive: boolean;
  selectedRouteId: string;
  canSelectRoute: boolean;
  isBusy: boolean;
  onRerouteAlternative?: () => void;
}

export function RecommendationBanner({
  stormActive,
  selectedRouteId,
  canSelectRoute,
  isBusy,
  onRerouteAlternative,
}: RecommendationBannerProps) {
  if (!stormActive && selectedRouteId === 'route_astra') return null;

  if (selectedRouteId === 'route_makh') {
    return (
      <div className={`${styles.card} ${styles.success}`}>
        <div className={styles.header}>
          <span className={styles.titleGroup}>
            <ShieldCheck size={14} className={styles.successIcon} />
            <span>Маршрут оптимизирован</span>
          </span>
          <Badge variant="success">Риск 22% (-16 ч)</Badge>
        </div>
        <p className={styles.body}>Обход штормовой зоны Энзели через порт Амирабад активен. Требуется e-CMR pre-clearance.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.danger}`}>
      <div className={styles.header}>
        <span className={styles.titleGroup}>
          <AlertTriangle size={14} className={styles.dangerIcon} />
          <span>Штормовое предупреждение</span>
        </span>
        <Badge variant="destructive">Риск 84%</Badge>
      </div>
      <p className={styles.body}>Волны 3.8м, ветер 62 км/ч в Энзели. Рекомендуется перестроение на Амирабад (-16 ч задержки).</p>
      <div className={styles.metaRow}><span>Задержка: +48 ч</span><span>Альтернатива: 22% риск</span></div>
      {onRerouteAlternative && (
        <Button size="sm" variant="default" disabled={!canSelectRoute || isBusy} onClick={onRerouteAlternative} className={styles.actionBtn}>
          Перестроить маршрут (/reroute-amirabad) <ArrowRight size={12} />
        </Button>
      )}
    </div>
  );
}
