'use client';

import { Leaf, TrendingDown } from 'lucide-react';
import { calculateEsgSummary, type CargoItem } from '@/entities/cargo';
import { Badge, Card, CardContent, CardHeader, CardTitle, Separator } from '@/shared/ui';
import { EmissionBarRow } from '../EmissionBarRow';
import styles from './EsgWidget.module.css';

interface EsgWidgetProps {
  selectedCargo: CargoItem;
}

export function EsgWidget({ selectedCargo }: EsgWidgetProps) {
  const { esg } = selectedCargo;
  const { totalCurrentKg, savedKg, reductionPercent } = calculateEsgSummary(esg);

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.titleWrap}>
            <Leaf className={styles.icon} />
            <CardTitle>ESG-калькулятор (След CO₂)</CardTitle>
          </div>
          <Badge variant={esg.rating === 'A+' ? 'success' : 'warning'}>
            ESG: {esg.rating}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={styles.content}>
        <div className={styles.summaryBox}>
          <div>
            <div className={styles.summaryLabel}>Мультимодал vs Чисто авто</div>
            <div className={styles.summaryValue}>{totalCurrentKg.toLocaleString('ru-RU')} кг CO₂</div>
          </div>
          <div className={styles.reductionPill}>
            <TrendingDown className={styles.trendIcon} />
            <span>-{reductionPercent}%</span>
          </div>
        </div>
        <div className={styles.bars}>
          <EmissionBarRow label="Ж/Д плечо" kg={esg.railKg} maxKg={esg.pureRoadKg} toneClass="bg-[var(--mode-rail)]" />
          <EmissionBarRow label="Морской паром" kg={esg.seaKg} maxKg={esg.pureRoadKg} toneClass="bg-[var(--mode-sea)]" />
          <EmissionBarRow label="Автодоставка" kg={esg.roadKg} maxKg={esg.pureRoadKg} toneClass="bg-[var(--mode-road)]" />
          <Separator />
          <EmissionBarRow label="База: только авто" kg={esg.pureRoadKg} maxKg={esg.pureRoadKg} toneClass="bg-[var(--status-danger)]" />
        </div>
        <div className={styles.savedNote}>
          Экономия по маршруту: <strong>{savedKg.toLocaleString('ru-RU')} кг CO₂</strong>
        </div>
      </CardContent>
    </Card>
  );
}

