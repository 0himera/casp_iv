'use client';

import { CargoSidebar } from '@/widgets/CargoSidebar';
import { DigitalTwinCenter } from '@/widgets/DigitalTwinCenter';
import { EsgWidget } from '@/widgets/EsgWidget';
import { HeaderStats } from '@/widgets/HeaderStats';
import { PredictiveChart } from '@/widgets/PredictiveChart';
import { useCommandCenterState } from '../../model/useCommandCenterState';
import styles from './CommandCenterPage.module.css';

export function CommandCenterPage() {
  const state = useCommandCenterState();

  return (
    <div className={styles.shell}>
      <HeaderStats
        stormActive={state.stormActive}
        avgHubHours={state.avgHubHours}
        savedCo2Tons={state.savedCo2Tons}
        activeContainers={1284}
        onToggleStorm={state.toggleStorm}
      />
      <main className={styles.grid}>
        <CargoSidebar
          cargos={state.cargos}
          selectedCargo={state.selectedCargo}
          verifyingId={state.verifyingId}
          onSelectCargo={state.setSelectedId}
          onRunPreClearance={state.runPreClearance}
        />
        <DigitalTwinCenter
          ports={state.ports}
          selectedCargo={state.selectedCargo}
          stormActive={state.stormActive}
          onReroute={state.rerouteCargo}
        />
        <aside className={styles.rightPanel}>
          <PredictiveChart
            forecast={state.forecast}
            stormActive={state.stormActive}
          />
          <EsgWidget selectedCargo={state.selectedCargo} />
        </aside>
      </main>
    </div>
  );
}
