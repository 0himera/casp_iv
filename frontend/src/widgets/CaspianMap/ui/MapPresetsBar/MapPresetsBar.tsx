'use client';

import { Compass, Layers, Navigation, PanelRight } from 'lucide-react';
import { MAP_PRESETS } from './presetsData';
import styles from './MapPresetsBar.module.css';

interface MapPresetsBarProps {
  activeId: string | null;
  dockOpen?: boolean;
  onSelectPreset: (id: string) => void;
  onReset: () => void;
  onFocusCargo: () => void;
  onToggleNetwork?: () => void;
  onToggleArchival?: () => void;
  onToggleDock?: () => void;
}

export function MapPresetsBar(p: MapPresetsBarProps) {
  return (
    <div className={styles.bar}>
      <button type="button" onClick={p.onReset} className={`${styles.presetBtn} ${p.activeId === 'overview' ? styles.active : ''}`}>
        <Compass className={styles.icon} /><span>Обзор</span>
      </button>
      <div className={styles.divider} />
      {p.onToggleNetwork && <button type="button" className={styles.presetBtn} onClick={p.onToggleNetwork}>Коридоры</button>}
      {p.onToggleArchival && (
        <button type="button" className={`${styles.presetBtn} ${p.activeId === 'archival' ? styles.active : ''}`} onClick={p.onToggleArchival}>
          <Layers className={styles.icon} /><span>Чертёж</span>
        </button>
      )}
      {p.onToggleDock && (
        <button type="button" className={`${styles.presetBtn} ${p.dockOpen ? styles.active : ''}`} onClick={p.onToggleDock}>
          <PanelRight className={styles.icon} /><span>Меню</span>
        </button>
      )}
      <div className={styles.divider} />
      {MAP_PRESETS.map((item) => (
        <button key={item.id} type="button" onClick={() => p.onSelectPreset(item.id)} className={`${styles.presetBtn} ${p.activeId === item.id ? styles.active : ''}`}>
          {item.label}
        </button>
      ))}
      <div className={styles.divider} />
      <button type="button" onClick={p.onFocusCargo} className={`${styles.presetBtn} ${p.activeId === 'cargo' ? styles.active : ''}`}>
        <Navigation className={styles.icon} /><span>Груз</span>
      </button>
    </div>
  );
}
