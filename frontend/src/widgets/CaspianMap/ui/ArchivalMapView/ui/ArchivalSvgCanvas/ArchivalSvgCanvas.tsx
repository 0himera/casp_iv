import { ARCHIVAL_GEO, type ArchivalPortGeo } from '../../../../model/archivalPins';
import { ArchivalSvgDecor } from '../ArchivalSvgDecor';
import { ArchivalSvgDefs } from '../ArchivalSvgDefs';
import { ArchivalSvgPorts } from '../ArchivalSvgPorts';
import { ArchivalSvgRoutes } from '../ArchivalSvgRoutes';
import styles from './ArchivalSvgCanvas.module.css';

interface ArchivalSvgCanvasProps {
  printEnabled?: boolean;
  activePortId: string;
  cargoLng?: number;
  cargoLat?: number;
  onSelect: (geo: ArchivalPortGeo) => void;
}

export function ArchivalSvgCanvas({ printEnabled = true, activePortId, cargoLng, cargoLat, onSelect }: ArchivalSvgCanvasProps) {
  return (
    <svg className={`${styles.svg} ${printEnabled ? styles.print : ''}`} viewBox={ARCHIVAL_GEO.viewBox} preserveAspectRatio="xMidYMid meet">
      <ArchivalSvgDefs />
      <rect width={ARCHIVAL_GEO.width} height={ARCHIVAL_GEO.height} fill="url(#archPaperGrad)" />
      {printEnabled && <rect width={ARCHIVAL_GEO.width} height={ARCHIVAL_GEO.height} fill="var(--riso-paper)" filter="url(#risoPaper)" opacity="0.14" />}
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
      <path d={ARCHIVAL_GEO.water} className={styles.waterBase} fillRule="evenodd" />
      {ARCHIVAL_GEO.bathymetry.map((b, i) => (
        <path key={i} d={b.path} fill={`var(--map-${b.depth <= 60 ? 'shallow' : b.depth <= 180 ? 'mid-depth' : b.depth <= 400 ? 'deep' : 'deepest'})`} className={styles.bathLayer} />
      ))}
      {printEnabled && <g clipPath="url(#risoWaterClip)" pointerEvents="none"><rect width={ARCHIVAL_GEO.width} height={ARCHIVAL_GEO.height} fill="url(#risoWaterDots)" className={styles.waterPrint} /></g>}
      <path d={ARCHIVAL_GEO.water} className={styles.shoreInk} fillRule="evenodd" />
      <ArchivalSvgRoutes activePortId={activePortId} />
      <ArchivalSvgDecor cargoLng={cargoLng} cargoLat={cargoLat} />
      <ArchivalSvgPorts activePortId={activePortId} onSelect={onSelect} />
    </svg>
  );
}

