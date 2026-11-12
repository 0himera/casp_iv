import { ARCHIVAL_PORTS, type ArchivalPortGeo } from '../../../../model/archivalPins';
import styles from './ArchivalSvgPorts.module.css';

interface ArchivalSvgPortsProps {
  activePortId: string;
  onSelect: (geo: ArchivalPortGeo) => void;
}

export function ArchivalSvgPorts({ activePortId, onSelect }: ArchivalSvgPortsProps) {
  return (
    <g>
      {ARCHIVAL_PORTS.map((p) => {
        const active = p.id === activePortId;
        const lx = p.x + p.labelDx;
        const ly = p.y + p.labelDy;
        const w = p.name.length * 6.2 + 16;
        const bx = p.anchor === 'end' ? lx - w + 4 : lx - 4;
        return (
          <g key={p.id} className={styles.pinGroup} onClick={() => onSelect(p)}>
            <circle cx={p.x} cy={p.y} r="16" fill="transparent" />
            <line x1={p.x} y1={p.y} x2={lx} y2={ly - 3} className={active ? styles.leaderActive : styles.leader} />
            {active && (
              <circle cx={p.x} cy={p.y} r="8" className={styles.pulseRing}>
                <animate attributeName="r" values="5;19;5" dur="2.1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.85;0;0.85" dur="2.1s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={p.x} cy={p.y} r={active ? 4.8 : 3.4} className={active ? styles.dotActive : styles.dot} />
            <rect x={bx} y={ly - 12} width={w} height={17} rx="3" className={active ? styles.boxActive : styles.box} />
            <text x={lx} y={ly} textAnchor={p.anchor} className={active ? styles.labelActive : styles.label}>
              {p.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}
