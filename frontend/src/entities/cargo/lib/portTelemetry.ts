import type { CaspianPort } from '../model/types';

export function resolvePortTelemetry(
  port: CaspianPort,
  stormActive: boolean
): CaspianPort {
  if (!stormActive || port.id !== 'anzali') {
    return port;
  }
  return {
    ...port,
    status: 'storm_restricted',
    waveHeightM: 3.8,
    windSpeedKmh: 62,
    windDirectionDeg: 25,
    windDirectionLabel: 'NNE',
    loadPercent: 96,
    berthsAvailable: 0,
    vesselsInRoadstead: 12,
  };
}
