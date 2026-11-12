import type { Edge, Node } from '@xyflow/react';
import type { MultimodalNodeData } from '@/entities/cargo';

export type ChainFlowNode = Node<MultimodalNodeData, 'chainNode'>;

const POSITIONS = [
  { x: 20, y: 30 },
  { x: 260, y: 30 },
  { x: 500, y: 30 },
  { x: 20, y: 185 },
  { x: 260, y: 185 },
  { x: 500, y: 185 },
];

export function buildFlowElements(items: MultimodalNodeData[]): {
  nodes: ChainFlowNode[];
  edges: Edge[];
} {
  const nodes: ChainFlowNode[] = items.map((item, idx) => ({
    id: item.id,
    type: 'chainNode',
    position: POSITIONS[idx] ?? { x: idx * 240, y: 30 },
    data: item,
  }));

  const edges: Edge[] = items.slice(0, -1).map((item, idx) => {
    const next = items[idx + 1];
    const hasRisk = next.status !== 'ok' || item.status !== 'ok';
    return {
      id: `e-${item.id}-${next.id}`,
      source: item.id,
      target: next.id,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: hasRisk ? 'var(--status-warning)' : 'var(--primary)',
        strokeWidth: 2,
      },
    };
  });

  return { nodes, edges };
}

