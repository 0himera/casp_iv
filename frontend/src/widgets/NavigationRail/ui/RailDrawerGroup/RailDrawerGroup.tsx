'use client';

import { Activity, CloudLightning, Package, ShieldCheck } from 'lucide-react';
import { RailItem } from '../RailItem';
import styles from './RailDrawerGroup.module.css';

interface RailDrawerGroupProps {
  manifestOpen: boolean;
  onToggleManifest: () => void;
  customsOpen: boolean;
  onToggleCustoms: () => void;
  analyticsOpen: boolean;
  onToggleAnalytics: () => void;
  stormActive?: boolean;
  onToggleStorm?: () => void;
}

export function RailDrawerGroup({
  manifestOpen,
  onToggleManifest,
  customsOpen,
  onToggleCustoms,
  analyticsOpen,
  onToggleAnalytics,
  stormActive = false,
  onToggleStorm,
}: RailDrawerGroupProps) {
  return (
    <div className={styles.group}>
      <RailItem icon={<Package size={18} />} label="Реестр отправлений" active={manifestOpen} onClick={onToggleManifest} />
      <RailItem icon={<ShieldCheck size={18} />} label="Таможенный pre-clearance" active={customsOpen} onClick={onToggleCustoms} />
      <RailItem icon={<Activity size={18} />} label="ESG и телеметрия" active={analyticsOpen} onClick={onToggleAnalytics} />
      {onToggleStorm && (
        <RailItem icon={<CloudLightning size={18} />} label="Симуляция шторма" active={stormActive} onClick={onToggleStorm} />
      )}
    </div>
  );
}
