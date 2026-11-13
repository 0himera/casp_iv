'use client';

import { Layers } from 'lucide-react';
import { PassportPanel } from '@/features/passport-attestation';
import { RouteDecisionOverlay } from '@/features/route-selection';
import { Badge, Button } from '@/shared/ui';
import { DemoControls } from '@/features/demo-controls';
import { HeaderNavActions } from '@/widgets/HeaderStats/ui/HeaderNavActions';
import { WorkspaceSummary } from './WorkspaceSummary';
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
      <HeroTelemetry shipment={s.shipment} stormActive={stormActive} />
      <main className={styles.container}>
        <section id="workspace" className={styles.mapSection} aria-label="Рабочая карта">
          <div className={styles.contextBar}>
            <h2>Маршрут груза</h2>
            <strong>{s.shipment.origin.name} → {s.shipment.destination.name}</strong>
            <span>{s.shipment.title} · {s.shipment.mass_tonnes} т</span>
            <Badge variant={s.apiOnline ? 'success' : 'warning'}>{s.apiOnline ? 'API ONLINE · груз сценарный' : 'Нет связи · демо'}</Badge>
          </div>
          <div className={styles.sectionHeader}>
            <HeaderNavActions items={s.items} selectedId={s.shipment.id} mode={l.mode} onSelectShipment={s.setSelectedId} onToggleMode={l.setMode} />
            <Button type="button" size="sm" variant={l.xrayMode ? 'default' : 'outline'} onClick={l.toggleXray}>
              <Layers className={styles.btnIcon} /> {l.xrayMode ? 'X-RAY ВКЛ' : 'X-RAY РЕНТГЕН'}
            </Button>
          </div>
          <SpatialCore mode={l.mode} ports={s.ports} shipment={s.shipment} stormActive={stormActive} xrayMode={l.xrayMode} role={s.role} isBusy={s.isBusy} onSelectRoute={s.selectRoute} onChangeRole={s.setRole} onAttest={s.attest} />
        </section>
        <div id="weather-section" className={styles.summaryRow}>
          <PredictiveChart shipment={s.shipment} stormActive={stormActive} />
          <WorkspaceSummary shipment={s.shipment} />
        </div>
        <section id="route-section" className={styles.planningSection}>
          <div className={styles.sectionLead}><div><span>ПЛАНИРОВАНИЕ</span><h2>До отправления</h2></div>
            <DemoControls showRoles={false} role={s.role} scenario={s.scenario} isBusy={s.isBusy} canRunScenario={a.canRunScenario} onChangeRole={s.setRole} onSelectScenario={s.selectScenario} />
          </div>
        <PlanningControls key={s.shipment.forecast.id} shipment={s.shipment} isBusy={s.isBusy} onCalculate={s.recalculate} />
        <div className={styles.bentoRow}>
          <div className={styles.bentoCell}><RouteDecisionOverlay shipment={s.shipment} stormActive={stormActive} activeOperation={s.activeOperation} operationTimedOut={s.operationTimedOut} errorBanner={s.errorBanner} isBusy={s.isBusy} onSelectRoute={s.selectRoute} onRerouteAlternative={a.onRerouteAlternative} onRecheckOperation={s.recheckNow} /></div>
          <div className={styles.bentoCell}><DraughtSimulator shipment={s.shipment} /></div>
        </div>
        </section>
        <section id="ledger-section" className={styles.bentoRow}>
          <div className={styles.ledgerTitle}><span>СОГЛАСОВАНИЕ</span><h2>Документы и след маршрута</h2></div>
          <div className={styles.bentoCell}><PassportPanel shipment={s.shipment} role={s.role} isBusy={s.isBusy} onAttest={s.attest} onVerifyEcmr={a.onVerifyEcmr} onReplaceDocument={s.replaceDocument} /></div>
          <div className={styles.bentoCell}><EsgWidget shipment={s.shipment} /></div>
        </section>
        <footer className={styles.footer}><a href="#intro">Caspian Transit</a><span>Открытые источники · Сценарное планирование · Casper testnet</span></footer>
      </main>
    </div>
  );
}
