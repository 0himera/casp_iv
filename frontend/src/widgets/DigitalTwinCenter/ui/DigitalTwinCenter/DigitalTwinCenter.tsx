'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { CaspianPort } from '@/entities/cargo';
import { RouteDecisionOverlay } from '@/features/route-selection';
import type { Operation, Shipment } from '@/shared/api/caspian';
import { Tabs, TabsContent } from '@/shared/ui';
import { CenterToolbar } from '../CenterToolbar';
import { SlashCommandBar } from '../SlashCommandBar';
import styles from './DigitalTwinCenter.module.css';

const CaspianMap = dynamic(() => import('@/widgets/CaspianMap').then((m) => m.CaspianMap), { ssr: false, loading: () => <div className={styles.loading}>Загрузка карты Каспия...</div> });
const MultimodalGraph = dynamic(() => import('@/widgets/MultimodalGraph').then((m) => m.MultimodalGraph), { ssr: false, loading: () => <div className={styles.loading}>Построение графа стыковки...</div> });

interface DigitalTwinCenterProps {
  ports: CaspianPort[];
  shipment: Shipment;
  stormActive: boolean;
  activeOperation: Operation | null;
  operationTimedOut: boolean;
  errorBanner: string | null;
  isBusy: boolean;
  onSelectRoute: (routeId: string) => void;
  onRecheckOperation: () => void;
  onToggleStorm: () => void;
  onVerifyEcmr: () => void;
}

export function DigitalTwinCenter({ ports, shipment, stormActive, activeOperation, operationTimedOut, errorBanner, isBusy, onSelectRoute, onRecheckOperation, onToggleStorm, onVerifyEcmr }: DigitalTwinCenterProps) {
  const [xrayMode, setXrayMode] = useState(false);
  const altRoute = shipment.routes.find((r) => r.id !== shipment.selected_route_id && r.feasible) ?? shipment.routes.find((r) => r.id !== shipment.selected_route_id);
  const canRunScenario = shipment.allowed_actions.includes('run_scenario');
  const canSelectRoute = shipment.allowed_actions.includes('select_route') && Boolean(altRoute);
  const canAttest = shipment.allowed_actions.includes('attest');

  return (
    <section className={styles.center}>
      <Tabs defaultValue="map" className={styles.tabsRoot}>
        <CenterToolbar shipment={shipment} xrayMode={xrayMode} />
        <div className={styles.workspaceRow}>
          <div className={styles.viewport}>
            <TabsContent value="map" className={styles.tabPane}><CaspianMap ports={ports} shipment={shipment} stormActive={stormActive} xrayMode={xrayMode} /></TabsContent>
            <TabsContent value="graph" className={styles.tabPane}><MultimodalGraph shipment={shipment} /></TabsContent>
            <RouteDecisionOverlay shipment={shipment} activeOperation={activeOperation} operationTimedOut={operationTimedOut} errorBanner={errorBanner} isBusy={isBusy} onSelectRoute={onSelectRoute} onRecheckOperation={onRecheckOperation} />
            <SlashCommandBar stormActive={stormActive} xrayMode={xrayMode} canRunScenario={canRunScenario} canSelectRoute={canSelectRoute} canAttest={canAttest} isBusy={isBusy} onToggleStorm={onToggleStorm} onRerouteAlternative={() => altRoute && onSelectRoute(altRoute.id)} onVerifyEcmr={onVerifyEcmr} onToggleXray={() => setXrayMode((v) => !v)} />
          </div>
          <span className={styles.verticalCaption}>CASPIAN // MULTIMODAL CORRIDOR // 42.98°N</span>
        </div>
      </Tabs>
    </section>
  );
}
