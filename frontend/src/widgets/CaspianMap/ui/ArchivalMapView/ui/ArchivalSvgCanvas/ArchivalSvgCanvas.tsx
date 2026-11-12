import { ARCHIVAL_GEO, type ArchivalPortGeo } from '../../../../model/archivalPins';
import { ArchivalSvgDecor } from '../ArchivalSvgDecor';
import { ArchivalSvgDefs } from '../ArchivalSvgDefs';
import { ArchivalSvgPorts } from '../ArchivalSvgPorts';
import { ArchivalSvgRoutes } from '../ArchivalSvgRoutes';
import styles from './ArchivalSvgCanvas.module.css';

interface ArchivalSvgCanvasProps {
  activePortId: string;
  cargoLng?: number;
  cargoLat?: number;
  onSelect: (geo: ArchivalPortGeo) => void;
}

export function ArchivalSvgCanvas({ activePortId, cargoLng, cargoLat, onSelect }: ArchivalSvgCanvasProps) {
  return (
    <svg className={styles.svg} viewBox={ARCHIVAL_GEO.viewBox} preserveAspectRatio="xMidYMid meet">
      <ArchivalSvgDefs />
      <rect width={ARCHIVAL_GEO.width} height={ARCHIVAL_GEO.height} fill="url(#archPaperGrad)" />
      <rect width={ARCHIVAL_GEO.width} height={ARCHIVAL_GEO.height} fill="url(#halftoneGrid)" />
      <circle cx="235" cy="435" r="220" fill="url(#haloOrange)" />
      <circle cx="675" cy="425" r="150" fill="url(#haloOrange)" />
      <circle cx="990" cy="175" r="165" fill="url(#haloOrange)" />
      <circle cx="635" cy="145" r="190" fill="url(#haloCyan)" />
      <circle cx="475" cy="235" r="145" fill="url(#haloCyan)" />
      <circle cx="1145" cy="130" r="260" fill="url(#haloDeep)" />
      <g>
        {ARCHIVAL_GEO.graticules.map((g) => (
          <g key={g.val}>
            <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} className={styles.gratLine} />
            <text x={g.type === 'parallel' ? g.x1 - 6 : g.x2 - 12} y={g.type === 'parallel' ? 48 : g.y2 + 12} className={styles.gratText}>
              {g.val}
            </text>
          </g>
        ))}
      </g>
      <path d={ARCHIVAL_GEO.water} className={styles.shoreBuffer} />
      <path d={ARCHIVAL_GEO.water} className={styles.waterBase} fillRule="evenodd" filter="url(#seaRimGlow)" />
      {ARCHIVAL_GEO.bathymetry.map((b, i) => (
        <path key={i} d={b.path} fill={b.color} className={styles.bathLayer} />
      ))}
      <path d={ARCHIVAL_GEO.water} className={styles.shoreInk} fillRule="evenodd" />
      <ArchivalSvgRoutes activePortId={activePortId} />
      <ArchivalSvgDecor cargoLng={cargoLng} cargoLat={cargoLat} />
      <ArchivalSvgPorts activePortId={activePortId} onSelect={onSelect} />
    </svg>
  );
}

