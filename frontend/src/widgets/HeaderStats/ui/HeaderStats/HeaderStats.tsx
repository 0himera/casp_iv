'use client';

import { Clock, Leaf, Scale, Waves } from 'lucide-react';
import { getSelectedRoute } from '@/entities/shipment';
import { DemoControls } from '@/features/demo-controls';
import type { Role, ScenarioRequest, Shipment } from '@/shared/api/caspian';
import { formatMskDateTime, formatProbability } from '@/shared/lib/formatters';
import { Badge, PixelMarker } from '@/shared/ui';
import { KpiTile } from '../KpiTile';
import styles from './HeaderStats.module.css';

interface HeaderStatsProps {
  shipment: Shipment;
  apiOnline: boolean;
  role: Role;
  scenario: ScenarioRequest['scenario'];
  isBusy: boolean;
  onChangeRole: (role: Role) => void;
  onSelectScenario: (scenario: ScenarioRequest['scenario']) => void;
}

export function HeaderStats({ shipment, apiOnline, role, scenario, isBusy, onChangeRole, onSelectScenario }: HeaderStatsProps) {
  const route = getSelectedRoute(shipment);
  const prob = shipment.forecast.miss_probability;
  const probTone = prob === null ? 'warning' : prob >= 0.5 ? 'danger' : prob >= 0.2 ? 'warning' : 'success';

  return (
    <header className={styles.header}>
      <div className={styles.brandBlock}>
        <PixelMarker variant={apiOnline ? 'telemetry' : 'alert'} />
        <div className={styles.brandMeta}>
          <div className={styles.brandTitleRow}>
            <span className={styles.brandName}>
              Smart Caspian <em className={styles.brandItalic}>Transit</em>
            </span>
            <span className={styles.stamp}>МТК Север–Юг</span>
          </div>
          <Badge variant={apiOnline ? 'success' : 'warning'} className={styles.statusBadge}>
            <span className={styles.squareDot} />
            {apiOnline ? 'Live API :18081' : 'Офлайн-резерв'}
          </Badge>
        </div>
      </div>
      <div className={styles.kpiRow}>
        <KpiTile label="Масса груза" value={`${shipment.mass_tonnes} т`} icon={<Scale className={styles.kpiIcon} />} />
        <KpiTile label="Риск срыва" value={formatProbability(prob)} tone={probTone} icon={<Waves className={styles.kpiIcon} />} />
        <KpiTile label="ETA (P50)" value={formatMskDateTime(route.eta.p50)} icon={<Clock className={styles.kpiIcon} />} />
        <KpiTile label="Выбросы CO₂e" value={route.emissions_kg_co2e !== null ? `${route.emissions_kg_co2e} кг` : 'Нет данных'} tone="success" icon={<Leaf className={styles.kpiIcon} />} />
      </div>
      <DemoControls role={role} scenario={scenario} canRunScenario={shipment.allowed_actions.includes('run_scenario')} isBusy={isBusy} onChangeRole={onChangeRole} onSelectScenario={onSelectScenario} />
    </header>
  );
}
