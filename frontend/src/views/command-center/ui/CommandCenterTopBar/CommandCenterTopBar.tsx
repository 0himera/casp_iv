'use client';

import type { Role, ScenarioRequest, Shipment } from '@/shared/api/caspian';
import { HeaderStats } from '@/widgets/HeaderStats';
import styles from './CommandCenterTopBar.module.css';

interface CommandCenterTopBarProps {
  shipment: Shipment;
  apiOnline: boolean;
  role: Role;
  scenario: ScenarioRequest['scenario'];
  isBusy: boolean;
  onChangeRole: (role: Role) => void;
  onSelectScenario: (scenario: ScenarioRequest['scenario']) => void;
}

export function CommandCenterTopBar(props: CommandCenterTopBarProps) {
  return (
    <div className={styles.topBar}>
      <HeaderStats {...props} />
    </div>
  );
}
