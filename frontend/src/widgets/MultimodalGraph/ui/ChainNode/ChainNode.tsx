'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ShieldCheck, Ship, Train, Truck } from 'lucide-react';
import { Badge, PixelMarker } from '@/shared/ui';
import type { ChainFlowNode } from '../../model/buildFlowElements';
import styles from './ChainNode.module.css';

function renderModeIcon(mode: string) {
  if (mode === 'rail') return <Train className={styles.icon} />;
  if (mode === 'sea') return <Ship className={styles.icon} />;
  if (mode === 'customs') return <ShieldCheck className={styles.icon} />;
  return <Truck className={styles.icon} />;
}

export const ChainNode = memo(function ChainNode({
  data,
}: NodeProps<ChainFlowNode>) {
  const badgeVariant =
    data.status === 'critical'
      ? 'destructive'
      : data.status === 'warning'
        ? 'warning'
        : 'success';
  const markerVariant = data.status === 'ok' ? 'verified' : 'alert';

  return (
    <div className={`${styles.node} ${styles[data.status]}`}>
      <Handle type="target" position={Position.Left} className={styles.handle} />
      <div className={styles.topRow}>
        <span className={styles.titleWrap}>
          <PixelMarker variant={markerVariant} />
          {renderModeIcon(data.mode)}
          <span className={styles.label}>{data.label}</span>
        </span>
        <Badge variant={badgeVariant} className={styles.collageTag}>
          {data.delayHours > 0 ? `+${data.delayHours}ч` : 'OK'}
        </Badge>
      </div>
      <div className={styles.location}>{data.location}</div>
      <div className={styles.eta}>План: {data.eta}</div>
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  );
});
