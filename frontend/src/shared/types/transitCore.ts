export type CargoStatus = 'in-transit' | 'delay-risk' | 'critical';
export type TransportMode = 'rail' | 'sea' | 'road';
export type NodeStatus = 'ok' | 'warning' | 'critical';
export type ClearanceStepStatus = 'cleared' | 'pending' | 'verifying';

export type PortOperationalStatus =
  | 'operational'
  | 'congested'
  | 'storm_restricted'
  | 'closed';

export interface CaspianPort {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  loadPercent: number;
  berthsAvailable: number;
  totalBerths: number;
  vesselsInRoadstead: number;
  waveHeightM: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windDirectionLabel: string;
  waterDepthM: number;
  status: PortOperationalStatus;
  archiveIndex: string;
  live?: {
    demoMetricsAvailable: boolean;
    windSpeed: number | null;
    windGusts: number | null;
    weatherAt: string | null;
    weatherStale: boolean;
    weatherSource: string | null;
    portCalls: number | null;
    activityDate: string | null;
    activityStale: boolean;
    activitySource: string | null;
    sailings: { name: string; status: string; category: string }[];
    sailingSources: { url: string; date: string; stale: boolean }[];
    sailingAvailable: boolean;
  };
}

export type CaspianPortTelemetry = CaspianPort;

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

