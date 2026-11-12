'use client';

import { AsciiCaspianBackground } from '@/shared/ui';
import { CargoSidebar } from '@/widgets/CargoSidebar';
import { DigitalTwinCenter } from '@/widgets/DigitalTwinCenter';
import { EsgWidget } from '@/widgets/EsgWidget';
import { HeaderStats } from '@/widgets/HeaderStats';
import { PredictiveChart } from '@/widgets/PredictiveChart';
import { useCommandCenterState } from '../../model/useCommandCenterState';
import styles from './CommandCenterPage.module.css';

export function CommandCenterPage() {
  const s = useCommandCenterState();
  const stormActive = s.scenario === 'storm';

  return (
    <div className={styles.root}>
      <AsciiCaspianBackground />
      <div className={styles.shell}>
        <HeaderStats
          shipment={s.shipment}
          apiOnline={s.apiOnline}
          role={s.role}
          scenario={s.scenario}
          isBusy={s.isBusy}
          onChangeRole={s.setRole}
          onSelectScenario={s.selectScenario}
        />
        <main className={styles.grid}>
          <CargoSidebar
            items={s.items}
            shipment={s.shipment}
            role={s.role}
            isBusy={s.isBusy}
            onSelectShipment={s.setSelectedId}
            onAttest={s.attest}
            onReplaceDocument={s.replaceDocument}
          />
          <DigitalTwinCenter
            ports={s.ports}
            shipment={s.shipment}
            stormActive={stormActive}
            activeOperation={s.activeOperation}
            operationTimedOut={s.operationTimedOut}
            errorBanner={s.errorBanner}
            isBusy={s.isBusy}
            onSelectRoute={s.selectRoute}
            onRecheckOperation={s.recheckNow}
            onToggleStorm={() => void s.selectScenario(stormActive ? 'normal' : 'storm')}
            onVerifyEcmr={() => s.attest('approved')}
          />
          <aside className={styles.rightPanel}>
            <PredictiveChart shipment={s.shipment} stormActive={stormActive} />
            <EsgWidget shipment={s.shipment} />
          </aside>
        </main>
      </div>
    </div>
  );
}
