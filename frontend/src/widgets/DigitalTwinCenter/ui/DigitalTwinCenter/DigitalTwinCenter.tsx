'use client';

import dynamic from 'next/dynamic';
import { CheckCircle2, Map as MapIcon, Network } from 'lucide-react';
import type { CargoItem, CaspianPort } from '@/entities/cargo';
import { AiDecisionCard } from '@/features/route-optimization';
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
  selectedCargo: CargoItem;
  stormActive: boolean;
  onReroute: (cargoId: string) => void;
}
export function DigitalTwinCenter({ ports, selectedCargo, stormActive, onReroute }: DigitalTwinCenterProps) {
  return (
    <section className={styles.center}>
      <Tabs defaultValue="map" className={styles.tabsRoot}>
        <div className={styles.toolbar}>
          <TabsList>
            <TabsTrigger value="map">
              <MapIcon className={styles.tabIcon} /> <span>Геокарта Каспия</span>
            </TabsTrigger>
            <TabsTrigger value="graph">
              <Network className={styles.tabIcon} /> <span>Граф цепочки</span>
            </TabsTrigger>
          </TabsList>
          <div className={styles.cargoPill}>
            <span className={styles.cargoCode}>{selectedCargo.code}</span>
            <span className={styles.cargoRoute}>{selectedCargo.routeTitle}</span>
            {selectedCargo.isRerouted && (
              <Badge variant="success">
                <CheckCircle2 className={styles.tabIcon} /> Оптимизирован
              </Badge>
            )}
          </div>
        </div>
        <div className={styles.viewport}>
          <TabsContent value="map" className={styles.tabPane}>
            <CaspianMap ports={ports} selectedCargo={selectedCargo} stormActive={stormActive} />
          </TabsContent>
          <TabsContent value="graph" className={styles.tabPane}>
            <MultimodalGraph selectedCargo={selectedCargo} />
          </TabsContent>
          <AiDecisionCard cargo={selectedCargo} onReroute={onReroute} />
        </div>
      </Tabs>
    </section>
  );
}
