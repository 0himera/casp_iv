import type { ForecastPoint } from '@/shared/types/transit';

export const BASE_FORECAST: ForecastPoint[] = [
  { day: 'Сегодня', portLoad: 68, predictedDelay: 4, waveHeight: 1.4 },
  { day: '+1 дн', portLoad: 72, predictedDelay: 6, waveHeight: 1.8 },
  { day: '+2 дн', portLoad: 79, predictedDelay: 11, waveHeight: 2.3 },
  { day: '+3 дн', portLoad: 74, predictedDelay: 8, waveHeight: 1.9 },
  { day: '+4 дн', portLoad: 66, predictedDelay: 5, waveHeight: 1.3 },
  { day: '+5 дн', portLoad: 61, predictedDelay: 3, waveHeight: 1.1 },
  { day: '+6 дн', portLoad: 58, predictedDelay: 2, waveHeight: 0.9 },
];

export const STORM_FORECAST: ForecastPoint[] = [
  { day: 'Сегодня', portLoad: 92, predictedDelay: 18, waveHeight: 3.8 },
  { day: '+1 дн', portLoad: 96, predictedDelay: 24, waveHeight: 4.1 },
  { day: '+2 дн', portLoad: 89, predictedDelay: 19, waveHeight: 3.4 },
  { day: '+3 дн', portLoad: 81, predictedDelay: 12, waveHeight: 2.5 },
  { day: '+4 дн', portLoad: 71, predictedDelay: 7, waveHeight: 1.7 },
  { day: '+5 дн', portLoad: 65, predictedDelay: 4, waveHeight: 1.2 },
  { day: '+6 дн', portLoad: 60, predictedDelay: 3, waveHeight: 1.0 },
];

