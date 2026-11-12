import type { CaspianPort } from '@/shared/types/transit';

export const MAKHACHKALA_PORT: CaspianPort = {
  id: 'makhachkala',
  name: 'Махачкала',
  country: 'РФ',
  lat: 42.98,
  lng: 47.5,
  loadPercent: 71,
  berthsAvailable: 3,
  totalBerths: 10,
  vesselsInRoadstead: 6,
  waveHeightM: 1.2,
  windSpeedKmh: 22,
  windDirectionDeg: 270,
  windDirectionLabel: 'W',
  waterDepthM: 11.2,
  status: 'operational',
  archiveIndex: '[ 00-020 / RU-MCX ]',
};
