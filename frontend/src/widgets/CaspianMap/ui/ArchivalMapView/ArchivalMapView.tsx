'use client';

import Image from 'next/image';
import { Anchor } from 'lucide-react';
import type { CaspianPort } from '@/entities/cargo';
import styles from './ArchivalMapView.module.css';

interface ArchivalMapViewProps {
  ports?: CaspianPort[];
  onSelectPort?: (port: CaspianPort) => void;
}

export function ArchivalMapView({ ports = [], onSelectPort }: ArchivalMapViewProps) {
  return (
    <div className={styles.wrap}>
      <Image src="/images/caspian-archival-map.jpg" alt="Спектральный чертёж Каспийского бассейна" fill className={styles.img} priority />
      <div className={styles.overlay} />
      <div className={styles.bottomBar}>
        <span className={styles.caption}>{'[ ARCHIVAL SPEC SHEET // КАСПИЙСКИЙ БАССЕЙН ]'}</span>
        {onSelectPort && ports.length > 0 && (
          <div className={styles.portBar}>
            {ports.map((p) => (
              <button key={p.id} type="button" onClick={() => onSelectPort(p)} className={styles.portChip}>
                <Anchor className={styles.icon} /> {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
