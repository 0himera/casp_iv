'use client';

import type { Role, ScenarioRequest, Shipment } from '@/shared/api/caspian';
import styles from './HeaderStats.module.css';

interface HeaderStatsProps {
  items: Array<{ id: string }>; shipment: Shipment; apiOnline: boolean;
  role: Role; scenario: ScenarioRequest['scenario']; mode: 'map' | 'graph';
  isBusy: boolean; canRunScenario: boolean;
  onSelectShipment: (id: string) => void; onToggleMode: (mode: 'map' | 'graph') => void;
  onChangeRole: (role: Role) => void; onSelectScenario: (scenario: ScenarioRequest['scenario']) => void;
}

export function HeaderStats({ role, onChangeRole }: HeaderStatsProps) {
  return <header className={styles.header}>
    <nav aria-label="Основная навигация" className={styles.links}>
      <a href="#workspace">Карта</a><a href="#route-section">Прогноз</a><a href="#ledger-section">Документы</a>
    </nav>
    <a className={styles.brand} href="#intro">Caspian Transit</a>
    <label className={styles.role}><span className={styles.roleLabel}>Роль</span>
      <select aria-label="Роль" value={role} onChange={(event) => onChangeRole(event.target.value as Role)}>
        <option value="logistician">Логист</option><option value="carrier">Перевозчик</option><option value="customs">Таможня</option>
      </select>
    </label>
  </header>;
}
