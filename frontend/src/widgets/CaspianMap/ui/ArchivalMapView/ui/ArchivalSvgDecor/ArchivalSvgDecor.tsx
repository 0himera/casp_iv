import { ARCHIVAL_GEO, projectArchivalCoord } from '../../../../model/archivalPins';
import { ArchivalShip } from './ArchivalShip';

interface ArchivalSvgDecorProps {
  cargoLng?: number;
  cargoLat?: number;
}

export function ArchivalSvgDecor({ cargoLng, cargoLat }: ArchivalSvgDecorProps) {
  const cargoPt = cargoLng !== undefined && cargoLat !== undefined
    ? projectArchivalCoord(cargoLng, cargoLat)
    : null;

  return (
    <g pointerEvents="none">
      <rect x="18" y="18" width="1164" height="584" fill="none" stroke="var(--map-shore)" strokeOpacity="0.28" strokeWidth="1" />
      <text x={ARCHIVAL_GEO.waterLabel.x} y={ARCHIVAL_GEO.waterLabel.y} textAnchor="middle" fill="var(--map-label)" fillOpacity="0.58" fontSize="13" letterSpacing="9" fontFamily="monospace">
        CASPIAN
      </text>
      <text x={ARCHIVAL_GEO.kbgLabel.x} y={ARCHIVAL_GEO.kbgLabel.y} textAnchor="middle" fill="var(--map-shore)" fillOpacity="0.65" fontSize="7.5" letterSpacing="1.6" fontFamily="monospace">
        КАРА-БОГАЗ
      </text>
      <text x="195" y="458" fill="var(--map-label)" fillOpacity="0.72" fontSize="8" fontFamily="monospace">
        ВКМСК // 4.5м
      </text>
      {ARCHIVAL_GEO.ships.map((s, idx) => (
        <ArchivalShip key={idx} x={s.x} y={s.y} rot={s.rot} index={idx} />
      ))}
      <g transform="translate(1082, 558)">
        <line x1="0" y1="0" x2="72" y2="0" stroke="var(--map-shore)" strokeWidth="1.2" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--map-shore)" strokeWidth="1.2" />
        <line x1="72" y1="-4" x2="72" y2="4" stroke="var(--map-shore)" strokeWidth="1.2" />
        <text x="36" y="-6" textAnchor="middle" fill="var(--map-label)" fontSize="8.5" fontFamily="monospace">200 КМ · 1:2.5M</text>
      </g>
      <g transform="translate(1118, 86)">
        <circle r="19" fill="var(--surface-low)" stroke="var(--border-strong)" strokeOpacity="0.8" strokeWidth="1" />
        <path d="M -12 0 L -2 -3 L -2 3 Z" fill="var(--primary)" />
        <text x="-15" y="-6" fill="var(--primary)" fontSize="8.5" fontWeight="700" fontFamily="monospace">N</text>
        <text x="0" y="-10" textAnchor="middle" fill="var(--map-label)" fontSize="7" fontFamily="monospace">E</text>
        <text x="0" y="14" textAnchor="middle" fill="var(--map-label)" fontSize="7" fontFamily="monospace">W</text>
        <text x="12" y="3" textAnchor="middle" fill="var(--map-label)" fontSize="7" fontFamily="monospace">S</text>
      </g>
      {cargoPt && (
        <g transform={`translate(${cargoPt.x}, ${cargoPt.y})`}>
          <circle r="10" fill="none" stroke="var(--status-warning)" strokeWidth="1.2" strokeOpacity="0.65" />
          <polygon points="0,-5 6,0 0,5 -6,0" fill="var(--status-warning)" stroke="var(--map-background)" strokeWidth="1.2" />
        </g>
      )}
    </g>
  );
}
