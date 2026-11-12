'use client';

import { Compass, Navigation } from 'lucide-react';
import styles from './MapPresetsBar.module.css';

interface MapPresetsBarProps {
  activeId: string | null;
  onSelectPreset: (id: string) => void;
  onReset: () => void;
  onFocusCargo: () => void;
}

const PRESETS = [
  { id: 'astra', label: 'Астрахань' },
  { id: 'makh', label: 'Махачкала' },
  { id: 'aktau', label: 'Актау' },
  { id: 'anzali', label: 'Энзели' },
  { id: 'amirabad', label: 'Амирабад' },
];

export function MapPresetsBar({
  activeId,
  onSelectPreset,
  onReset,
  onFocusCargo,
}: MapPresetsBarProps) {
  return (
    <div className={styles.bar}>
      <button
        type="button"
        onClick={onReset}
        className={`${styles.presetBtn} ${activeId === 'overview' ? styles.active : ''}`}
      >
        <Compass className={styles.icon} />
        <span>Обзор</span>
      </button>
      <div className={styles.divider} />
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelectPreset(p.id)}
          className={`${styles.presetBtn} ${activeId === p.id ? styles.active : ''}`}
        >
          {p.label}
        </button>
      ))}
      <div className={styles.divider} />
      <button
        type="button"
        onClick={onFocusCargo}
        className={`${styles.presetBtn} ${activeId === 'cargo' ? styles.active : ''}`}
      >
        <Navigation className={styles.icon} />
        <span>Груз</span>
      </button>
    </div>
  );
}
