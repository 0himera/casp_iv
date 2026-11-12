'use client';

import dynamic from 'next/dynamic';
import { Map as MapIcon, Network } from 'lucide-react';
import type { CaspianPort } from '@/entities/cargo';
import { RouteDecisionOverlay } from '@/features/route-selection';
import type { Operation, Shipment } from '@/shared/api/caspian';
import { formatMskDateTime } from '@/shared/lib/formatters';
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';
import styles from './DigitalTwinCenter.module.css';

const CaspianMap = dynamic(() => import('@/widgets/CaspianMap').then((m) => m.CaspianMap), {
  ssr: false,
  loading: () => <div className={styles.loading}>Загрузка карты Каспия...</div>,
});
const MultimodalGraph = dynamic(() => import('@/widgets/MultimodalGraph').then((m) => m.MultimodalGraph), {
  ssr: false,
  loading: () => <div className={styles.loading}>Построение графа стыковки...</div>,
});

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
}
export function DigitalTwinCenter({ ports, shipment, stormActive, activeOperation, operationTimedOut, errorBanner, isBusy, onSelectRoute, onRecheckOperation }: DigitalTwinCenterProps) {
  return (
    <section className={styles.center}>
      <Tabs defaultValue="map" className={styles.tabsRoot}>
        <div className={styles.toolbar}>
          <TabsList>
            <TabsTrigger value="map"><MapIcon className={styles.tabIcon} /> <span>Геокарта Каспия</span></TabsTrigger>
            <TabsTrigger value="graph"><Network className={styles.tabIcon} /> <span>Граф цепочки</span></TabsTrigger>
          </TabsList>
          <div className={styles.cargoPill}>
            <span className={styles.cargoCode}>{shipment.id}</span>
            <span className={styles.cargoRoute}>{shipment.origin.name} → {shipment.destination.name}</span>
            <Badge variant="outline">{formatMskDateTime(shipment.scenario_time)}</Badge>
          </div>
        </div>
        <div className={styles.viewport}>
          <TabsContent value="map" className={styles.tabPane}>
            <CaspianMap ports={ports} shipment={shipment} stormActive={stormActive} />
          </TabsContent>
          <TabsContent value="graph" className={styles.tabPane}>
            <MultimodalGraph shipment={shipment} />
          </TabsContent>
          <RouteDecisionOverlay shipment={shipment} activeOperation={activeOperation} operationTimedOut={operationTimedOut} errorBanner={errorBanner} isBusy={isBusy} onSelectRoute={onSelectRoute} onRecheckOperation={onRecheckOperation} />
        </div>
      </Tabs>
    </section>
  );
}
