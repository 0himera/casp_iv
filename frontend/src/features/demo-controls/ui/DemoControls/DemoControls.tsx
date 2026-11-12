'use client';

import { AlertTriangle, CloudOff, ShieldCheck } from 'lucide-react';
import type { Role, ScenarioRequest } from '@/shared/api/caspian';
import { Button } from '@/shared/ui';
import styles from './DemoControls.module.css';

interface DemoControlsProps {
  role: Role;
  scenario: ScenarioRequest['scenario'];
  canRunScenario: boolean;
  isBusy: boolean;
  onChangeRole: (role: Role) => void;
  onSelectScenario: (scenario: ScenarioRequest['scenario']) => void;
}

const ROLES: { id: Role; label: string }[] = [
  { id: 'logistician', label: 'Логист' },
  { id: 'carrier', label: 'Перевозчик' },
  { id: 'customs', label: 'Таможня' },
];

export function DemoControls({
  role,
  scenario,
  canRunScenario,
  isBusy,
  onChangeRole,
  onSelectScenario,
}: DemoControlsProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.group}>
        {ROLES.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={role === item.id ? 'secondary' : 'outline'}
            onClick={() => onChangeRole(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className={styles.group}>
        <Button type="button" size="sm" variant={scenario === 'normal' ? 'secondary' : 'outline'} disabled={!canRunScenario || isBusy} onClick={() => onSelectScenario('normal')}>
          <ShieldCheck className={styles.icon} /> Открытая погода
        </Button>
        <Button type="button" size="sm" variant={scenario === 'storm' ? 'destructive' : 'outline'} disabled={!canRunScenario || isBusy} onClick={() => onSelectScenario('storm')}>
          <AlertTriangle className={styles.icon} /> Шторм (сценарий)
        </Button>
        <Button type="button" size="sm" variant={scenario === 'missing_data' ? 'secondary' : 'outline'} disabled={!canRunScenario || isBusy} onClick={() => onSelectScenario('missing_data')}>
          <CloudOff className={styles.icon} /> Нет данных
        </Button>
      </div>
    </div>
  );
}
