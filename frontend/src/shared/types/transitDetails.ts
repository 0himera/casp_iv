import type {
  ClearanceStepStatus,
  MultimodalNodeData,
  RouteSegment,
} from './transitCore';

export interface SmartContractStep {
  id: string;
  authority: string;
  status: ClearanceStepStatus;
}

export interface SmartContractInfo {
  hash: string;
  eCmrStatus: string;
  accelerationHours: number;
  isCleared: boolean;
  steps: SmartContractStep[];
}

export interface EsgMetrics {
  railKg: number;
  seaKg: number;
  roadKg: number;
  pureRoadKg: number;
  rating: 'A+' | 'A' | 'B';
}

export interface AlternativeRoute {
  label: string;
  reason: string;
  segments: RouteSegment[];
  currentPosition: [number, number];
  graphNodes: MultimodalNodeData[];
  delayReductionHours: number;
  esg: EsgMetrics;
}
