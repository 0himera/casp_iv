'use client';

import { Map as MapIcon, Network } from 'lucide-react';
import { Button } from '@/shared/ui';
import styles from './HeaderNavActions.module.css';

interface HeaderNavActionsProps {
  items: Array<{ id: string; title?: string }>;
  selectedId: string;
  mode: 'map' | 'graph';
  onSelectShipment: (id: string) => void;
  onToggleMode: (mode: 'map' | 'graph') => void;
}

export function HeaderNavActions({
  items,
  selectedId,
  mode,
  onSelectShipment,
  onToggleMode,
}: HeaderNavActionsProps) {
  return (
    <div className={styles.wrap}>
      {items.length > 1 && <label className={styles.shipment}>Груз
        <select aria-label="Отправка" value={selectedId} onChange={(e) => onSelectShipment(e.target.value)}>
          {items.map((item) => <option key={item.id} value={item.id}>{item.title ?? 'Отправка'} · {item.id.slice(-5)}</option>)}
        </select>
      </label>}
      <div className={styles.group}>
        <Button type="button" size="sm" aria-pressed={mode === 'map'} variant={mode === 'map' ? 'secondary' : 'ghost'} onClick={() => onToggleMode('map')}>
          <MapIcon className={styles.icon} /> Карта
        </Button>
        <Button type="button" size="sm" aria-pressed={mode === 'graph'} variant={mode === 'graph' ? 'secondary' : 'ghost'} onClick={() => onToggleMode('graph')}>
          <Network className={styles.icon} /> Граф
        </Button>
      </div>
    </div>
  );
}
