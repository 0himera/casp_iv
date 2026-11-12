'use client';

import type { EsgModeContribution } from '@/entities/shipment';
import styles from './EsgModeBars.module.css';

interface EsgModeBarsProps {
  modes: EsgModeContribution[];
  totalKg: number;
}

export function EsgModeBars({ modes, totalKg }: EsgModeBarsProps) {
  return (
    <div className={styles.bars}>
      {modes.map((item) => {
        const pct = Math.round((item.kg / totalKg) * 100);
        const fillClass = item.mode === 'rail' ? styles.rail : item.mode === 'sea' ? styles.sea : styles.road;

        return (
          <div key={item.mode} className={styles.row}>
            <div className={styles.meta}>
              <span>{item.label}</span>
              <span>{item.kg} кг ({pct}%)</span>
            </div>
            <div className={styles.track}>
              <div className={`${styles.fill} ${fillClass}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
