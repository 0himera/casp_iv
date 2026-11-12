'use client';

import { Layers } from 'lucide-react';
import { PassportPanel } from '@/features/passport-attestation';
import { RouteDecisionOverlay } from '@/features/route-selection';
import { Button } from '@/shared/ui';
import { DraughtSimulator } from '@/widgets/DraughtSimulator';
import { EsgWidget } from '@/widgets/EsgWidget';
import { HeroTelemetry } from '@/widgets/HeroTelemetry';
import { PredictiveChart } from '@/widgets/PredictiveChart';
import { SpatialCore } from '@/widgets/SpatialCore';
import { useCommandCenterActions } from '../../model/useCommandCenterActions';
import { useCommandCenterState } from '../../model/useCommandCenterState';
import { useLayoutState } from '../../model/useLayoutState';
import { PlanningControls } from '@/features/route-selection/ui/PlanningControls';
import { CommandCenterTopBar } from '../CommandCenterTopBar';
import styles from './CommandCenterPage.module.css';

export function CommandCenterPage() {
  const s = useCommandCenterState();
  const l = useLayoutState();
  const stormActive = s.scenario === 'storm';
  const a = useCommandCenterActions({ ...s, stormActive });
  return (
    <div className={styles.root}>
      <CommandCenterTopBar items={s.items} shipment={s.shipment} apiOnline={s.apiOnline} role={s.role} scenario={s.scenario} mode={l.mode} isBusy={s.isBusy} canRunScenario={a.canRunScenario} onSelectShipment={s.setSelectedId} onToggleMode={l.setMode} onChangeRole={s.setRole} onSelectScenario={s.selectScenario} />
      <main className={styles.container}>
        <HeroTelemetry shipment={s.shipment} stormActive={stormActive} />
        <section className={styles.mapSection}>
          <div className={styles.sectionHeader}>
            <div><span className={styles.sectionStamp}>01 / КАРТОГРАФИЯ</span><h2 className={styles.sectionTitle}>Между берегами</h2></div>
            <Button type="button" size="sm" variant={l.xrayMode ? 'default' : 'outline'} onClick={l.toggleXray}>
              <Layers className={styles.btnIcon} /> {l.xrayMode ? 'X-RAY ВКЛ' : 'X-RAY РЕНТГЕН'}
            </Button>
          </div>
          <SpatialCore mode={l.mode} ports={s.ports} shipment={s.shipment} stormActive={stormActive} xrayMode={l.xrayMode} role={s.role} isBusy={s.isBusy} onSelectRoute={s.selectRoute} onChangeRole={s.setRole} onAttest={s.attest} />
        </section>
        <DraughtSimulator shipment={s.shipment} />
        <PlanningControls key={s.shipment.forecast.id} shipment={s.shipment} isBusy={s.isBusy} onCalculate={s.recalculate} />
        <section id="route-section" className={styles.bentoRow}>
          <div className={styles.sectionLead}><span className={styles.sectionStamp}>02 / ПЛАНИРОВАНИЕ</span><h2 className={styles.sectionTitle}>До отправления</h2><p>Готовность груза, погодные окна и варианты пути.</p></div>
          <div className={styles.bentoCell}><RouteDecisionOverlay shipment={s.shipment} stormActive={stormActive} activeOperation={s.activeOperation} operationTimedOut={s.operationTimedOut} errorBanner={s.errorBanner} isBusy={s.isBusy} onSelectRoute={s.selectRoute} onRerouteAlternative={a.onRerouteAlternative} onRecheckOperation={s.recheckNow} /></div>
          <div className={styles.bentoCell}><PredictiveChart shipment={s.shipment} stormActive={stormActive} /></div>
        </section>
        <section id="ledger-section" className={styles.bentoRow}>
          <div className={styles.sectionLead}><span className={styles.sectionStamp}>03 / СОГЛАСОВАНИЕ</span><h2 className={styles.sectionTitle}>Один комплект документов</h2><p>Версии, решения участников и след маршрута.</p></div>
          <div className={styles.bentoCell}><PassportPanel shipment={s.shipment} role={s.role} isBusy={s.isBusy} onAttest={s.attest} onVerifyEcmr={a.onVerifyEcmr} onReplaceDocument={s.replaceDocument} /></div>
          <div className={styles.bentoCell}><EsgWidget shipment={s.shipment} /></div>
        </section>
        <footer className={styles.colophon}><span>CASPIAN <em>Transit</em> · ВЫПУСК 01</span><span>Маршрутный журнал / МТК «Север–Юг»</span><span className={styles.printerMarks} aria-hidden="true">▮ ▮ ▮</span></footer>
      </main>
    </div>
  );
}
