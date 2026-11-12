'use client';

import Image from 'next/image';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { Button } from '@/shared/ui';
import { HeroKpiGrid } from '../HeroKpiGrid';
import styles from './HeroTelemetry.module.css';

interface HeroTelemetryProps {
  shipment: Shipment;
  stormActive: boolean;
}

export function HeroTelemetry({ shipment, stormActive }: HeroTelemetryProps) {
  const selectedRoute = shipment.routes.find((r) => r.id === shipment.selected_route_id);
  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className={styles.section}>
      <div className={styles.backdrop} aria-hidden="true">
        <Image src="/images/caspian-archival-map.jpg" alt="" fill className={styles.bgImage} priority />
        <div className={styles.bgMask} />
      </div>
      <div className={styles.content}>
        <span className={styles.overline}>{'[ CASPIAN BASIN // SPECTRAL TELEMETRY V4.2A ]'}</span>
        <h1 className={styles.headline}>
          Спектральная картография <span className={styles.accentSerif}>каспийских</span> коридоров
        </h1>
        <p className={styles.subtitle}>
          Мультимодальный контроль переходов, прогностическое моделирование погодных окон и криптографическая аттестация рейсов на базе блокчейн-реестра.
        </p>
        <div className={styles.actions}>
          <Button type="button" variant="default" size="lg" onClick={() => jumpTo('route-section')}>
            ВЫБРАТЬ МАРШРУТ И ПРОГНОЗ <ArrowRight className={styles.icon} />
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => jumpTo('ledger-section')}>
            <ShieldCheck className={styles.icon} /> SMART LEDGER #V{shipment.passport.version}
          </Button>
        </div>
      </div>
      <HeroKpiGrid shipment={shipment} selectedRoute={selectedRoute} stormActive={stormActive} />
    </section>
  );
}
