import seedJson from './seedShipment.json';
import marineJson from './sources/open-meteo-marine.json';
import weatherJson from './sources/open-meteo-weather.json';
import type { Shipment } from '@/shared/api/caspian';
import { CASPIAN_PORTS } from './transit/ports';

export const SEED_SHIPMENT = seedJson as Shipment;
export { CASPIAN_PORTS };

export interface MarineWeatherPoint {
  hour: string;
  waveHeight: number;
  windGusts: number;
}

export const CASPIAN_WEATHER_SERIES: MarineWeatherPoint[] = marineJson.hourly.time.map(
  (iso, index) => ({
    hour: iso.slice(11, 16),
    waveHeight: marineJson.hourly.wave_height[index] ?? 0,
    windGusts: weatherJson.hourly.wind_gusts_10m[index] ?? 0,
  })
);
