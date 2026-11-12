import type { CargoStatus, MultimodalNodeData, RouteSegment } from './transitCore';
import type { AlternativeRoute, EsgMetrics, SmartContractInfo } from './transitDetails';

export * from './transitCore';
export * from './transitDetails';

export interface CargoItem {
  id: string;
  code: string;
  routeTitle: string;
  cargoType: string;
  weightTons: number;
  status: CargoStatus;
  delayHours: number;
  bottleneckReason: string | null;
  segments: RouteSegment[];
  currentPosition: [number, number];
  graphNodes: MultimodalNodeData[];
  alternativeRoute: AlternativeRoute | null;
  smartContract: SmartContractInfo;
  esg: EsgMetrics;
  isRerouted?: boolean;
  affectedByEnzeliStorm?: boolean;
}

export interface ForecastPoint {
  day: string;
  portLoad: number;
  predictedDelay: number;
  waveHeight: number;
}

