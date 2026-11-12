'use client';

import type { Role, ScenarioRequest, Shipment } from '@/shared/api/caspian';
import { HeaderStats } from '@/widgets/HeaderStats';
import styles from './CommandCenterTopBar.module.css';

interface CommandCenterTopBarProps {
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

export function CommandCenterTopBar(props: CommandCenterTopBarProps) {
  return (
    <div className={styles.topBar}>
      <div className={styles.inner}>
        <HeaderStats {...props} />
      </div>
    </div>
  );
}
