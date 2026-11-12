'use client';

import { Map, Network } from 'lucide-react';
import { RailItem } from '../RailItem';
import styles from './RailModeGroup.module.css';

interface RailModeGroupProps {
  mode: 'map' | 'graph';
  onToggleMode: (mode: 'map' | 'graph') => void;
}

export function RailModeGroup({ mode, onToggleMode }: RailModeGroupProps) {
  return (
    <div className={styles.group}>
      <RailItem
        icon={<Map size={18} />}
        label="Геокарта Каспия"
        active={mode === 'map'}
        onClick={() => onToggleMode('map')}
      />
      <RailItem
        icon={<Network size={18} />}
        label="Граф цепочки"
        active={mode === 'graph'}
        onClick={() => onToggleMode('graph')}
      />
    </div>
  );
}
