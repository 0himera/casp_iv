'use client';

import { getSelectedRoute, recalculateEsg } from '@/entities/shipment';
import type { Shipment } from '@/shared/api/caspian';
import { Badge, PixelMarker, Separator, ViewfinderFrame } from '@/shared/ui';
import { EsgModeBars } from '../EsgModeBars';
import { EsgSummaryBlock } from '../EsgSummaryBlock';
import { TimelinePanel } from '../TimelinePanel';
import styles from './EsgWidget.module.css';

interface EsgWidgetProps {
  shipment: Shipment;
}

export function EsgWidget({ shipment }: EsgWidgetProps) {
  const selected = getSelectedRoute(shipment);
  const esg = recalculateEsg(selected.id);

  return (
    <ViewfinderFrame stamp="ESG: демо и журнал" className={styles.card}>
      <div className={styles.titleRow}>
        <span className={styles.titleWrap}>
          <PixelMarker variant="verified" />
          <h3 className={styles.heading}>Баланс <em className={styles.headingItalic}>ESG-метрик</em></h3>
        </span>
        <Badge variant={esg.rating === 'A+' ? 'success' : 'warning'} className={styles.collageBadge}>
          Демо · ESG: {esg.rating}
        </Badge>
      </div>
      <EsgSummaryBlock esg={esg} />
      <EsgModeBars modes={esg.modesBreakdown} totalKg={esg.totalCurrentKg} />
      <div className={styles.savedNote}>
        Демонстрационные значения, не подтверждённый расчёт GLEC.
      </div>
      <Separator />
      <TimelinePanel events={shipment.timeline} />
    </ViewfinderFrame>
  );
}
