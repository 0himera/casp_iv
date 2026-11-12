import type { CaspianPort } from '@/shared/types/transit';

export const AKTAU_PORT: CaspianPort = {
  id: 'aktau',
  name: 'Актау',
  country: 'РК',
  lat: 43.65,
  lng: 51.16,
  loadPercent: 58,
  berthsAvailable: 6,
  totalBerths: 12,
  vesselsInRoadstead: 3,
  waveHeightM: 1.1,
  windSpeedKmh: 19,
  windDirectionDeg: 0,
  windDirectionLabel: 'N',
  waterDepthM: 8.5,
  status: 'operational',
  archiveIndex: '[ 00-021 / KZ-SCO ]',
};
