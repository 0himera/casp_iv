'use client';

import Image from 'next/image';
import styles from './ArchivalMapView.module.css';

export function ArchivalMapView() {
  return (
    <div className={styles.wrap}>
      <Image
        src="/images/caspian-archival-map.jpg"
        alt="Спектральный чертёж Каспийского бассейна"
        fill
        className={styles.img}
        priority
      />
      <div className={styles.overlay} />
      <div className={styles.caption}>
        [ ARCHIVAL SPEC SHEET // КАСПИЙСКИЙ БАССЕЙН · ТЕРМАЛЬНАЯ КАРТОГРАФИЯ ]
      </div>
    </div>
  );
}

