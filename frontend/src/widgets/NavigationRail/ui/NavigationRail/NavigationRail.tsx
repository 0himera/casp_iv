'use client';

import { PixelMarker } from '@/shared/ui';
import { RailDrawerGroup } from '../RailDrawerGroup';
import { RailModeGroup } from '../RailModeGroup';
import { RailSignature } from '../RailSignature';
import styles from './NavigationRail.module.css';

export interface NavigationRailProps {
  mode: 'map' | 'graph';
  onToggleMode: (mode: 'map' | 'graph') => void;
  manifestOpen: boolean;
  onToggleManifest: () => void;
  customsOpen: boolean;
  onToggleCustoms: () => void;
  analyticsOpen: boolean;
  onToggleAnalytics: () => void;
  stormActive?: boolean;
  onToggleStorm?: () => void;
}

export function NavigationRail({
  mode,
  onToggleMode,
  manifestOpen,
  onToggleManifest,
  customsOpen,
  onToggleCustoms,
  analyticsOpen,
  onToggleAnalytics,
  stormActive,
  onToggleStorm,
}: NavigationRailProps) {
  return (
    <aside className={styles.rail}>
      <div className={styles.topGroup}>
        <div className={styles.insigniaWrap}>
          <PixelMarker variant="telemetry" />
        </div>
        <RailModeGroup mode={mode} onToggleMode={onToggleMode} />
        <div className={styles.divider} />
        <RailDrawerGroup
          manifestOpen={manifestOpen}
          onToggleManifest={onToggleManifest}
          customsOpen={customsOpen}
          onToggleCustoms={onToggleCustoms}
          analyticsOpen={analyticsOpen}
          onToggleAnalytics={onToggleAnalytics}
          stormActive={stormActive}
          onToggleStorm={onToggleStorm}
        />
      </div>
      <RailSignature />
    </aside>
  );
}
