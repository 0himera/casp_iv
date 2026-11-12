'use client';

import { Map as MapIcon, Network } from 'lucide-react';
import { Button } from '@/shared/ui';
import styles from './HeaderNavActions.module.css';

interface HeaderNavActionsProps {
  items: Array<{ id: string }>;
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
      {items.length > 1 && (
        <div className={styles.group}>
          {items.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={item.id === selectedId ? 'secondary' : 'ghost'}
              onClick={() => onSelectShipment(item.id)}
            >
              {item.id}
            </Button>
          ))}
        </div>
      )}
      <div className={styles.group}>
        <Button type="button" size="sm" variant={mode === 'map' ? 'secondary' : 'ghost'} onClick={() => onToggleMode('map')}>
          <MapIcon className={styles.icon} /> Карта
        </Button>
        <Button type="button" size="sm" variant={mode === 'graph' ? 'secondary' : 'ghost'} onClick={() => onToggleMode('graph')}>
          <Network className={styles.icon} /> Граф
        </Button>
      </div>
    </div>
  );
}
