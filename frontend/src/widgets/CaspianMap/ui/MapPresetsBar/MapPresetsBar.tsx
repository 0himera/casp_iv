'use client';

import { Compass, Navigation } from 'lucide-react';
import { MAP_PRESETS } from './presetsData';
import styles from './MapPresetsBar.module.css';

interface MapPresetsBarProps {
  activeId: string | null;
  onSelectPreset: (id: string) => void;
  onReset: () => void;
  onFocusCargo: () => void;
  onToggleNetwork?: () => void;
}

export function MapPresetsBar({
  activeId, onSelectPreset, onReset, onFocusCargo, onToggleNetwork,
}: MapPresetsBarProps) {
  return (
    <div className={styles.bar}>
      <button type="button" onClick={onReset} className={`${styles.presetBtn} ${activeId === 'overview' ? styles.active : ''}`}>
        <Compass className={styles.icon} />
        <span>Обзор</span>
      </button>
      <div className={styles.divider} />
      {onToggleNetwork && <button type="button" className={styles.presetBtn} onClick={onToggleNetwork}>Сеть портов</button>}
      {MAP_PRESETS.map((p) => (
        <button key={p.id} type="button" onClick={() => onSelectPreset(p.id)} className={`${styles.presetBtn} ${activeId === p.id ? styles.active : ''}`}>
          {p.label}
        </button>
      ))}
      <div className={styles.divider} />
      <button type="button" onClick={onFocusCargo} className={`${styles.presetBtn} ${activeId === 'cargo' ? styles.active : ''}`}>
        <Navigation className={styles.icon} />
        <span>Груз</span>
      </button>
    </div>
  );
}
