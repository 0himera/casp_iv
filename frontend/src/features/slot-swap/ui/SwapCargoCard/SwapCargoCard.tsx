'use client';

import { Badge } from '@/shared/ui';
import styles from './SwapCargoCard.module.css';

export interface SwapCargoCardProps {
  isDelayed?: boolean;
  lotId: string;
  badgeText: string;
  badgeVariant: 'destructive' | 'success';
  company: string;
  massTonnes: number;
  location: string;
  thirdLabel: string;
  thirdValue: string;
  isThirdDanger?: boolean;
  fourthLabel: string;
  fourthValue: string;
  isFourthDanger?: boolean;
}

export function SwapCargoCard(props: SwapCargoCardProps) {
  const shortId = props.lotId.length > 14
    ? `${props.lotId.slice(0, 8)}…${props.lotId.slice(-4)}`
    : props.lotId;

  const cardClass = `${styles.card} ${props.isDelayed ? styles.delayed : styles.ready}`;

  return (
    <div className={cardClass}>
      <div className={styles.head}>
        <div className={styles.titleRow}>
          <span className={styles.lotId} title={props.lotId}>{shortId}</span>
          <span className={styles.badgeWrap}>
            <Badge variant={props.badgeVariant}>{props.badgeText}</Badge>
          </span>
        </div>
        <span className={styles.company} title={props.company}>{props.company}</span>
      </div>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.label}>Вес партии:</span>
          <span className={styles.val}>{props.massTonnes} т</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Локация:</span>
          <span className={styles.val} title={props.location}>{props.location}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>{props.thirdLabel}:</span>
          <span className={props.isThirdDanger ? styles.danger : styles.ok}>{props.thirdValue}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>{props.fourthLabel}:</span>
          <span className={props.isFourthDanger ? styles.danger : styles.val}>{props.fourthValue}</span>
        </div>
      </div>
    </div>
  );
}

