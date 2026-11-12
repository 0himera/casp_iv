export type CargoStatus = 'in-transit' | 'delay-risk' | 'critical';

export type TransportMode = 'rail' | 'sea' | 'road';

export type NodeStatus = 'ok' | 'warning' | 'critical';

export type ClearanceStepStatus = 'cleared' | 'pending' | 'verifying';

export interface CaspianPort {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  loadPercent: number;
  berthsAvailable: number;
}

export interface RouteSegment {
  mode: TransportMode;
  coordinates: [number, number][];
}

export interface MultimodalNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  location: string;
  mode: TransportMode | 'customs';
  status: NodeStatus;
  delayHours: number;
  eta: string;
}

