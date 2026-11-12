'use client';

import { recalculateEsg } from '@/entities/shipment';
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
  const esg = recalculateEsg(shipment);

  return (
    <ViewfinderFrame tone="sage" stamp="ESG: расчёт и журнал" className={styles.card}>
      <div className={styles.titleRow}>
        <span className={styles.titleWrap}>
          <PixelMarker variant="verified" />
          <h3 className={styles.heading}>Баланс <em className={styles.headingItalic}>ESG-метрик</em></h3>
        </span>
        <Badge variant="secondary" className={styles.collageBadge}>
          Сценарный расчёт
        </Badge>
      </div>
      <EsgSummaryBlock esg={esg} />
      <EsgModeBars modes={esg.modesBreakdown} totalKg={esg.totalCurrentKg ?? 0} />
      <div className={styles.savedNote}>
        {esg.source}. Масса: {shipment.mass_tonnes} т. Транспортные плечи без терминальных операций.
      </div>
      <Separator />
      <TimelinePanel events={shipment.timeline} />
    </ViewfinderFrame>
  );
}
