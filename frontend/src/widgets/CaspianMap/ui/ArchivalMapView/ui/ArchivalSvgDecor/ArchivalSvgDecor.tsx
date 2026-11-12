import { ARCHIVAL_GEO, projectArchivalCoord } from '../../../../model/archivalPins';

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
      <rect x="18" y="18" width="1164" height="584" fill="none" stroke="rgba(255,140,160,0.22)" strokeWidth="1" />
      <text x={ARCHIVAL_GEO.waterLabel.x} y={ARCHIVAL_GEO.waterLabel.y} textAnchor="middle" fill="#DCE9F2" fillOpacity="0.58" fontSize="13" letterSpacing="9" fontFamily="monospace">
        CASPIAN
      </text>
      <text x={ARCHIVAL_GEO.kbgLabel.x} y={ARCHIVAL_GEO.kbgLabel.y} textAnchor="middle" fill="#B5D4E6" fillOpacity="0.65" fontSize="7.5" letterSpacing="1.6" fontFamily="monospace">
        КАРА-БОГАЗ
      </text>
      <text x="195" y="458" fill="#FFB800" fillOpacity="0.88" fontSize="8" fontFamily="monospace">
        ВКМСК // 4.5м
      </text>
      {ARCHIVAL_GEO.ships.map((s, idx) => (
        <g key={idx} transform={`translate(${s.x}, ${s.y}) rotate(${s.rot})`} opacity="0.75">
          <path d="M -9 2 L 7 2 L 10 -1 L -7 -1 Z" fill="#FFF5F5" />
          <rect x="-4" y="-4" width="6" height="3" fill="#E8CCD2" />
        </g>
      ))}
      <g transform="translate(1082, 558)">
        <line x1="0" y1="0" x2="72" y2="0" stroke="rgba(255,140,160,0.35)" strokeWidth="1.2" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="rgba(255,140,160,0.35)" strokeWidth="1.2" />
        <line x1="72" y1="-4" x2="72" y2="4" stroke="rgba(255,140,160,0.35)" strokeWidth="1.2" />
        <text x="36" y="-6" textAnchor="middle" fill="#E8CCD2" fontSize="8.5" fontFamily="monospace">200 КМ · 1:2.5M</text>
      </g>
      <g transform="translate(1118, 86)">
        <circle r="19" fill="rgba(43,5,11,0.88)" stroke="rgba(255,140,160,0.35)" strokeWidth="1" />
        <path d="M -12 0 L -2 -3 L -2 3 Z" fill="#FFB800" />
        <text x="-15" y="-6" fill="#FFB800" fontSize="8.5" fontWeight="700" fontFamily="monospace">N</text>
        <text x="0" y="-10" textAnchor="middle" fill="#E8CCD2" fontSize="7" fontFamily="monospace">E</text>
        <text x="0" y="14" textAnchor="middle" fill="#E8CCD2" fontSize="7" fontFamily="monospace">W</text>
        <text x="12" y="3" textAnchor="middle" fill="#E8CCD2" fontSize="7" fontFamily="monospace">S</text>
      </g>
      {cargoPt && (
        <g transform={`translate(${cargoPt.x}, ${cargoPt.y})`}>
          <circle r="10" fill="none" stroke="#FFB800" strokeWidth="1.2" strokeOpacity="0.85">
            <animate attributeName="r" values="5;14;5" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0;0.9" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <polygon points="0,-5 6,0 0,5 -6,0" fill="#FFB800" stroke="#170205" strokeWidth="1.2" />
        </g>
      )}
    </g>
  );
}
