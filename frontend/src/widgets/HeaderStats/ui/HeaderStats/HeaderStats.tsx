'use client';

import { Anchor, Clock, Container, Leaf, Waves } from 'lucide-react';
import { ForceMajeureButton } from '@/features/force-majeure';
import { Badge } from '@/shared/ui';
import { KpiTile } from '../KpiTile';
import styles from './HeaderStats.module.css';

interface HeaderStatsProps {
  stormActive: boolean;
  avgHubHours: number;
  savedCo2Tons: number;
  activeContainers: number;
  onToggleStorm: () => void;
}

export function HeaderStats({
  stormActive,
  avgHubHours,
  savedCo2Tons,
  activeContainers,
  onToggleStorm,
}: HeaderStatsProps) {
  const stormValue = stormActive ? '8.9 / 10 (Шторм)' : '3.2 / 10 (Умер.)';
  return (
    <header className={styles.header}>
      <div className={styles.brandBlock}>
        <div className={styles.logoIcon}>
          <Anchor className={styles.anchor} />
        </div>
        <div className={styles.brandMeta}>
          <span className={styles.brandName}>Smart Caspian Transit</span>
          <Badge variant={stormActive ? 'destructive' : 'success'}>
            <span className={styles.dot} />
            МТК Север-Юг · Каспийский узел: Онлайн
          </Badge>
        </div>
      </div>
      <div className={styles.kpiRow}>
        <KpiTile label="Активные контейнеры" value={`${activeContainers} TEU`} icon={<Container className={styles.kpiIcon} />} />
        <KpiTile label="Ср. время в хабе" value={`${avgHubHours} ч`} tone={stormActive ? 'warning' : 'default'} icon={<Clock className={styles.kpiIcon} />} />
        <KpiTile label="Штормовая опасность" value={stormValue} tone={stormActive ? 'danger' : 'success'} icon={<Waves className={styles.kpiIcon} />} />
        <KpiTile label="Сэкономлено CO₂" value={`${savedCo2Tons.toFixed(1)} т`} tone="success" icon={<Leaf className={styles.kpiIcon} />} />
      </div>
      <ForceMajeureButton stormActive={stormActive} onToggle={onToggleStorm} />
    </header>
  );
}
