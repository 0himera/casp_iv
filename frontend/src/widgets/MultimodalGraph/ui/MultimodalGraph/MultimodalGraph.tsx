'use client';

import { useMemo } from 'react';
import { Background, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { CargoItem } from '@/entities/cargo';
import { buildFlowElements } from '../../model/buildFlowElements';
import { ChainNode } from '../ChainNode';
import styles from './MultimodalGraph.module.css';

interface MultimodalGraphProps {
  selectedCargo: CargoItem;
}

const NODE_TYPES = { chainNode: ChainNode };

export function MultimodalGraph({ selectedCargo }: MultimodalGraphProps) {
  const { nodes, edges } = useMemo(
    () => buildFlowElements(selectedCargo.graphNodes),
    [selectedCargo.graphNodes]
  );

  return (
    <div className={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        colorMode="dark"
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

