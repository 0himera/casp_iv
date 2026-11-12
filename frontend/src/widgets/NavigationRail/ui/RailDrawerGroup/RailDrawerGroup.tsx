'use client';

import { Activity, Package, ShieldCheck } from 'lucide-react';
import { RailItem } from '../RailItem';
import styles from './RailDrawerGroup.module.css';

interface RailDrawerGroupProps {
  manifestOpen: boolean;
  onToggleManifest: () => void;
  customsOpen: boolean;
  onToggleCustoms: () => void;
  analyticsOpen: boolean;
  onToggleAnalytics: () => void;
}

export function RailDrawerGroup({
  manifestOpen,
  onToggleManifest,
  customsOpen,
  onToggleCustoms,
  analyticsOpen,
  onToggleAnalytics,
}: RailDrawerGroupProps) {
  return (
    <div className={styles.group}>
      <RailItem
        icon={<Package size={18} />}
        label="Реестр отправлений"
        active={manifestOpen}
        onClick={onToggleManifest}
      />
      <RailItem
        icon={<ShieldCheck size={18} />}
        label="Таможенный pre-clearance"
        active={customsOpen}
        onClick={onToggleCustoms}
      />
      <RailItem
        icon={<Activity size={18} />}
        label="ESG и телеметрия"
        active={analyticsOpen}
        onClick={onToggleAnalytics}
      />
    </div>
  );
}
