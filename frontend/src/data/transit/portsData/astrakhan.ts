import type { CaspianPort } from '@/shared/types/transit';

export const ASTRAKHAN_PORT: CaspianPort = {
  id: 'astrakhan',
  name: 'Астрахань',
  country: 'РФ',
  lat: 46.34,
  lng: 48.03,
  loadPercent: 64,
  berthsAvailable: 5,
  totalBerths: 14,
  vesselsInRoadstead: 4,
  waveHeightM: 0.6,
  windSpeedKmh: 16,
  windDirectionDeg: 315,
  windDirectionLabel: 'NW',
  waterDepthM: 4.8,
  status: 'operational',
  archiveIndex: '[ 00-019 / RU-AST ]',
};
