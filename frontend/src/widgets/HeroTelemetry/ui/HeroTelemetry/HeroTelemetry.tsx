'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import styles from './HeroTelemetry.module.css';

export function HeroTelemetry({ shipment }: { shipment: Shipment; stormActive: boolean }) {
  return <section id="intro" className={styles.section} aria-label="Через Каспий">
    <Image src="/images/caspian-thermal-shores.webp" alt="" fill priority sizes="(max-width: 700px) 1140px, 100vw" className={styles.art} />
    <div className={styles.content}>
      <h1 className={styles.headline}>Через Каспий.<br />Согласованным маршрутом.</h1>
      <p className={styles.subtitle}>Погода, маршруты и документы в одном окне.</p>
      <a className={styles.cta} href="#workspace">Выбрать маршрут <ArrowRight size={17} /></a>
    </div>
    <div className={styles.annotations}>
      <a href="#weather-section">Погода в портах <ArrowRight size={14} /></a>
      <a href="#ledger-section">Паспорт груза · v{shipment.passport.version} <ArrowRight size={14} /></a>
    </div>
  </section>;
}
