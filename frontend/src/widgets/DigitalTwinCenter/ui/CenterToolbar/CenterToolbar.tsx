'use client';

import { Map as MapIcon, Network } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { formatMskDateTime } from '@/shared/lib/formatters';
import { Badge, PixelMarker, TabsList, TabsTrigger } from '@/shared/ui';
import styles from './CenterToolbar.module.css';

interface CenterToolbarProps {
  shipment: Shipment;
  xrayMode: boolean;
}

export function CenterToolbar({ shipment, xrayMode }: CenterToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.titleBlock}>
        <PixelMarker variant={xrayMode ? 'ai' : 'telemetry'} />
        <h1 className={styles.heading}>
          Цифровой <em className={styles.headingItalic}>двойник хаба</em>
        </h1>
        <TabsList>
          <TabsTrigger value="map"><MapIcon className={styles.tabIcon} /> <span>Геокарта</span></TabsTrigger>
          <TabsTrigger value="graph"><Network className={styles.tabIcon} /> <span>Граф цепочки</span></TabsTrigger>
        </TabsList>
      </div>
      <div className={styles.cargoMeta}>
        <span className={styles.cargoCode}>{shipment.id}</span>
        <span className={styles.cargoRoute}>{shipment.origin.name} → {shipment.destination.name}</span>
        <Badge variant="outline">{formatMskDateTime(shipment.scenario_time)}</Badge>
      </div>
    </div>
  );
}
