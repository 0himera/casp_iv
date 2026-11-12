'use client';

import Image from 'next/image';
import type { CaspianPort } from '@/entities/cargo';
import { ARCHIVAL_PINS, getArchivalPin } from '../../model/archivalPins';
import styles from './ArchivalMapView.module.css';

interface ArchivalMapViewProps {
  ports?: CaspianPort[];
  selectedPortId?: string | null;
  onSelectPort?: (port: CaspianPort) => void;
}

export function ArchivalMapView({ ports = [], selectedPortId, onSelectPort }: ArchivalMapViewProps) {
  const activeId = selectedPortId ?? ports[0]?.id ?? 'aktau';
  const activePin = getArchivalPin(activeId);
  const activePort = ports.find((p) => p.id === activeId);

  return (
    <div className={styles.wrap}>
      <Image src="/images/caspian-archival-map.jpg" alt="Спектральный чертёж Каспийского бассейна" fill className={styles.img} priority />
      <div className={styles.scanLine} aria-hidden="true" />
      <svg className={styles.svgOverlay} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {activePin && activePin.peers.map((peerId) => {
          const peer = getArchivalPin(peerId);
          if (!peer) return null;
          const mx = (activePin.x + peer.x) / 2, my = Math.min(activePin.y, peer.y) - 6;
          return <path key={peerId} d={`M ${activePin.x} ${activePin.y} Q ${mx} ${my} ${peer.x} ${peer.y}`} className={styles.vectorArc} />;
        })}
      </svg>
      {ARCHIVAL_PINS.map((pin) => {
        const port = ports.find((p) => p.id === pin.id);
        if (!port) return null;
        const active = port.id === activeId;
        return (
          <button key={pin.id} type="button" onClick={() => onSelectPort?.(port)} style={{ left: `${pin.x}%`, top: `${pin.y}%` }} className={`${styles.pinBtn} ${active ? styles.pinActive : ''}`}>
            <span className={styles.pinDot} />
            <span className={styles.pinLabel}>{port.name}</span>
          </button>
        );
      })}
      {activePin && activePort && (
        <div className={styles.callout} style={{ left: `${Math.min(72, Math.max(4, activePin.x + 3))}%`, top: `${Math.max(12, activePin.y - 14)}%` }}>
          <div className={styles.calloutHead}>{activePort.name} · {activePort.country}</div>
          <div className={styles.calloutMeta}>{activePort.lat.toFixed(2)}°N, {activePort.lng.toFixed(2)}°E · ВЕТЕР {activePort.live?.windSpeed ?? activePort.windSpeedKmh} км/ч</div>
        </div>
      )}
      <div className={styles.caption}>{'[ ARCHIVAL SPEC SHEET // КАСПИЙСКИЙ БАССЕЙН ]'}</div>
    </div>
  );
}
