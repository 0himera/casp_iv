'use client';

import { History } from 'lucide-react';
import type { TimelineEvent } from '@/shared/api/caspian';
import { formatMskDateTime } from '@/shared/lib/formatters';
import styles from './TimelinePanel.module.css';

interface TimelinePanelProps {
  events: TimelineEvent[];
}

export function TimelinePanel({ events }: TimelinePanelProps) {
  const recent = [...events].reverse().slice(0, 5);
  return (
    <div className={styles.wrap}>
      <div className={styles.heading}>
        <History className={styles.icon} />
        <span>Журнал событий</span>
      </div>
      <div className={styles.list}>
        {recent.map((evt) => (
          <div key={evt.id} className={styles.item}>
            <div className={styles.title}>{evt.title}</div>
            <div className={styles.meta}>
              <span>{evt.actor} · v{evt.passport_version}</span>
              <span>{formatMskDateTime(evt.occurred_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
