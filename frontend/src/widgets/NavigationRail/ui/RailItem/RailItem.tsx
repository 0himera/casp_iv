'use client';

import type { ReactNode } from 'react';
import styles from './RailItem.module.css';

interface RailItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  onClick: () => void;
}

export function RailItem({ icon, label, active = false, badge, onClick }: RailItemProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={active ? styles.btnActive : styles.btn}
    >
      <span className={styles.iconWrap}>{icon}</span>
      {badge && <span className={styles.badge}>{badge}</span>}
      {active && <span className={styles.activeIndicator} />}
    </button>
  );
}
