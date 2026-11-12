'use client';

import type { Role, ScenarioRequest, Shipment } from '@/shared/api/caspian';
import { DemoControls } from '@/features/demo-controls';
import { Badge, LivePing } from '@/shared/ui';
import { HeaderNavActions } from '../HeaderNavActions';
import styles from './HeaderStats.module.css';

interface HeaderStatsProps {
  items: Array<{ id: string }>;
  shipment: Shipment;
  apiOnline: boolean;
  role: Role;
  scenario: ScenarioRequest['scenario'];
  mode: 'map' | 'graph';
  isBusy: boolean;
  canRunScenario: boolean;
  onSelectShipment: (id: string) => void;
  onToggleMode: (mode: 'map' | 'graph') => void;
  onChangeRole: (role: Role) => void;
  onSelectScenario: (scenario: ScenarioRequest['scenario']) => void;
}

export function HeaderStats(props: HeaderStatsProps) {
  const { items, shipment, apiOnline, role, scenario, mode, isBusy } = props;
  return (
    <header className={styles.header}>
      <div className={styles.brandBlock}>
        <div className={styles.brandTitleRow}>
          <span className={styles.brandName}>CaspiFlow</span>
          <span className={styles.brandItalic}>Atlas</span>
          <span className={styles.stamp}>{`${shipment.id} // REV ${shipment.revision}`}</span>
        </div>
        <Badge variant={apiOnline ? 'success' : 'warning'} className={styles.statusBadge}>
          {apiOnline ? <LivePing /> : <span className={styles.warnDot} />}
          <span>{apiOnline ? 'TELEMETRY LIVE' : 'OFFLINE'}</span>
        </Badge>
      </div>
      <div className={styles.controlsBlock}>
        <HeaderNavActions items={items} selectedId={shipment.id} mode={mode} onSelectShipment={props.onSelectShipment} onToggleMode={props.onToggleMode} />
        <DemoControls role={role} scenario={scenario} isBusy={isBusy} canRunScenario={props.canRunScenario} onChangeRole={props.onChangeRole} onSelectScenario={props.onSelectScenario} />
      </div>
    </header>
  );
}
