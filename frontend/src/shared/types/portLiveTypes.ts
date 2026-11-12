export interface PortLiveMetrics {
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
}

