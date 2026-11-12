import { ARCHIVAL_GEO } from '../../../../model/archivalPins';
import { ARCHIVAL_MARINE_ROUTES } from '../../../../model/archivalMarineRoutes';
import styles from './ArchivalSvgRoutes.module.css';

interface ArchivalSvgRoutesProps {
  activePortId: string;
}

export function ArchivalSvgRoutes({ activePortId }: ArchivalSvgRoutesProps) {
  return (
    <g pointerEvents="none">
      <path d={ARCHIVAL_GEO.canal} className={styles.canal} />
      {ARCHIVAL_MARINE_ROUTES.map((r) => {
        const isActive = r.from === activePortId || r.to === activePortId;
        if (isActive) return null;
        return <path key={r.id} d={r.d} className={styles.passive} />;
      })}
      {ARCHIVAL_MARINE_ROUTES.map((r) => {
        const isActive = r.from === activePortId || r.to === activePortId;
        if (!isActive) return null;
        return (
          <g key={r.id}>
            <path d={r.d} className={styles.activeHalo} />
            <path d={r.d} className={styles.activeLine} />
            <circle r="3.2" fill="var(--foreground)" stroke="var(--primary)" strokeWidth="1.4" />
          </g>
        );
      })}
    </g>
  );
}
