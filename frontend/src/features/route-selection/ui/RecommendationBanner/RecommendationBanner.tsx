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

  if (selectedRouteId !== 'route_astra') {
    const isAktau = selectedRouteId === 'route_aktau';
    const tag = isAktau ? 'Восточный коридор (Актау)' : 'Маршрут · сценарий';
    const badge = isAktau ? 'Демо · риск 12%' : 'Демо · риск 22%';
    const text = isAktau ? 'Транзит через Казахстан и порт Актау. Сценарий: штормовой фронт обойдён.' : 'Обход штормовой зоны Энзели через Амирабад активен.';
    return (
      <div className={`${styles.card} ${styles.success}`}>
        <div className={styles.header}>
          <span className={styles.titleGroup}><ShieldCheck size={14} className={styles.successIcon} /><span>{tag}</span></span>
          <Badge variant="success">{badge}</Badge>
        </div>
        <p className={styles.body}>{text}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.danger}`}>
      <div className={styles.header}>
        <span className={styles.titleGroup}><AlertTriangle size={14} className={styles.dangerIcon} /><span>Штормовой сценарий</span></span>
        <Badge variant="destructive">Демо · риск 84%</Badge>
      </div>
      <p className={styles.body}>Волны 3.8м, ветер 62 км/ч в Энзели. Рекомендуется перестроение на Амирабад или Актау.</p>
      <div className={styles.metaRow}><span>Задержка: +48 ч</span><span>Альтернатива: 12% риск</span></div>
      {onRerouteAlternative && (
        <Button size="sm" variant="default" disabled={!canSelectRoute || isBusy} onClick={onRerouteAlternative} className={styles.actionBtn}>
          Перестроить маршрут в обход шторма <ArrowRight size={12} />
        </Button>
      )}
    </div>
  );
}
