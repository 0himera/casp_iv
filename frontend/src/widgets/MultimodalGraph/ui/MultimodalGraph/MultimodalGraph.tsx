'use client';

import { useMemo } from 'react';
import { Background, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { buildGraphNodesFromShipment, getSelectedRoute } from '@/entities/shipment';
import type { Shipment } from '@/shared/api/caspian';
import { buildFlowElements } from '../../model/buildFlowElements';
import { ChainNode } from '../ChainNode';
import styles from './MultimodalGraph.module.css';

interface MultimodalGraphProps {
  shipment: Shipment;
}

const NODE_TYPES = { chainNode: ChainNode };

export function MultimodalGraph({ shipment }: MultimodalGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const route = getSelectedRoute(shipment);
    return buildFlowElements(buildGraphNodesFromShipment(shipment, route));
  }, [shipment]);

  return (
    <div className={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        colorMode="light"
        fitView
        fitViewOptions={{ padding: 0.25 }}
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
