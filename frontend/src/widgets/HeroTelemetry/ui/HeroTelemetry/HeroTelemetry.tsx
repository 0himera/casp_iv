'use client';

import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { Button } from '@/shared/ui';
import geo from '@/data/archivalVectorMap.json';
import { HeroKpiGrid } from '../HeroKpiGrid';
import { PosterInk } from '../PosterInk/PosterInk';
import styles from './HeroTelemetry.module.css';

export function HeroTelemetry({ shipment, stormActive }: { shipment: Shipment; stormActive: boolean }) {
  const selectedRoute = shipment.routes.find((r) => r.id === shipment.selected_route_id);
  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start',
  });
  return <section className={styles.section} aria-label="Маршрутный журнал">
    <div className={styles.backdrop} aria-hidden="true"><PosterInk className={styles.colorFields} /></div>
    <div className={styles.folio}><span>МТК «СЕВЕР–ЮГ» / КАСПИЙСКИЙ БАССЕЙН</span><span>ВЫПУСК 01 · ЦИФРОВОЙ АТЛАС</span></div>
    <div className={styles.main}>
      <div className={styles.content}>
        <span className={styles.overline}>Погода. Стыковки. Согласования.</span>
        <h1 className={styles.headline}>Каспийский<br /><span className={styles.accentSerif}>маршрутный</span><br />журнал<span className={styles.period}>.</span></h1>
        <p className={styles.subtitle}>Один груз — несколько путей. Сравните маршруты через Каспий, оцените риск стыковки и согласуйте документы в одном окне.</p>
        <div className={styles.actions}>
          <Button type="button" size="lg" onClick={() => jumpTo('route-section')}>Маршруты и прогноз <ArrowRight size={15} /></Button>
          <Button type="button" variant="outline" size="lg" onClick={() => jumpTo('ledger-section')}><ShieldCheck size={15} /> Паспорт груза · v{shipment.passport.version}</Button>
        </div>
      </div>
      <div className={styles.poster} aria-hidden="true">
        <div className={styles.posterTop}><span>CASPIAN / TRANSIT</span><span>PL. 01</span></div>
        <svg viewBox={`0 0 ${geo.height} ${geo.width}`} className={styles.seaDrawing}>
          <defs><pattern id="heroSeaPrint" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.7" fill="#f5ecd9" /></pattern></defs>
          <g transform={`translate(${geo.height} 0) rotate(90)`}>
            <path d={geo.water} fill="#26372f" fillRule="evenodd" opacity="0.92" />
            <path d={geo.water} fill="url(#heroSeaPrint)" fillRule="evenodd" opacity="0.26" />
            <path d={geo.water} fill="none" stroke="#f8edd8" strokeWidth="1.5" />
            <path d={geo.water} fill="none" stroke="#b94334" strokeWidth="1.5" transform="translate(4 -2)" />
          </g>
        </svg>
        <span className={styles.posterMark}>КАСПИЙ<br /><em>связать берега</em></span>
        <span className={styles.registration}>✳</span>
        <div className={styles.posterBottom}><span>РОССИЯ · ИРАН · КАЗАХСТАН<br />АЗЕРБАЙДЖАН · ТУРКМЕНИСТАН</span><span className={styles.inkBars}><i /><i /><i /></span></div>
      </div>
    </div>
    <HeroKpiGrid shipment={shipment} selectedRoute={selectedRoute} stormActive={stormActive} />
  </section>;
}
