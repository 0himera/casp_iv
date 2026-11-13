'use client';

import dynamic from 'next/dynamic';
import type { SpatialCoreProps } from '../../model/types';
import styles from './SpatialCore.module.css';

const CaspianMap = dynamic(
  () => import('@/widgets/CaspianMap').then((m) => m.CaspianMap),
  {
    ssr: false,
    loading: () => <div className={styles.loading}>Загрузка геокарты...</div>,
  }
);

const MultimodalGraph = dynamic(
  () => import('@/widgets/MultimodalGraph').then((m) => m.MultimodalGraph),
  {
    ssr: false,
    loading: () => <div className={styles.loading}>Построение графа...</div>,
  }
);

export function SpatialCore({
  mode,
  ports,
  shipment,
  stormActive,
  role,
  isBusy,
  onSelectRoute,
  onChangeRole,
}: SpatialCoreProps) {
  return (
    <div className={styles.container}>
      {mode === 'map' ? (
        <CaspianMap
          ports={ports}
          shipment={shipment}
          stormActive={stormActive}
          role={role}
          isBusy={isBusy}
          onSelectRoute={onSelectRoute}
          onChangeRole={onChangeRole}
        />
      ) : (
        <MultimodalGraph shipment={shipment} />
      )}
    </div>
  );
}
