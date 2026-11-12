'use client';

import { Sparkles, Route, ArrowRight } from 'lucide-react';
import type { CargoItem } from '@/entities/cargo';
import { Badge, Button, Card, CardContent } from '@/shared/ui';
import styles from './AiDecisionCard.module.css';

interface AiDecisionCardProps {
  cargo: CargoItem;
  onReroute: (cargoId: string) => void;
}

export function AiDecisionCard({ cargo, onReroute }: AiDecisionCardProps) {
  if (!cargo.bottleneckReason || !cargo.alternativeRoute || cargo.isRerouted) {
    return null;
  }

  return (
    <Card className={styles.overlayCard}>
      <CardContent className={styles.content}>
        <div className={styles.headerRow}>
          <div className={styles.titleWrap}>
            <Sparkles className={styles.aiIcon} />
            <span className={styles.title}>AI-рекомендация диспетчера</span>
          </div>
          <Badge variant="destructive">+{cargo.delayHours} ч риска</Badge>
        </div>
        <p className={styles.reason}>{cargo.bottleneckReason}</p>
        <div className={styles.benefitRow}>
          Экономия времени: -{cargo.alternativeRoute.delayReductionHours} ч ·
          Рейтинг ESG {cargo.alternativeRoute.esg.rating}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => onReroute(cargo.id)}
          className={styles.actionBtn}
        >
          <Route className={styles.btnIcon} />
          <span>{cargo.alternativeRoute.label}</span>
          <ArrowRight className={styles.btnIcon} />
        </Button>
      </CardContent>
    </Card>
  );
}
