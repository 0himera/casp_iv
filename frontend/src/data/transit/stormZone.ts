import type { FeatureCollection, Polygon } from 'geojson';

export const CALM_ZONE_GEOJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { severity: 'moderate', label: 'Умеренное волнение 1.8 м' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [49.05, 37.65],
            [49.85, 37.65],
            [49.95, 38.25],
            [49.15, 38.3],
            [49.05, 37.65],
          ],
        ],
      },
    },
  ],
};

export const STORM_ZONE_GEOJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { severity: 'critical', label: 'Шторм Энзели · Волна 3.8 м' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [48.75, 37.3],
            [50.65, 37.35],
            [51.1, 38.9],
            [49.65, 39.45],
            [48.65, 38.55],
            [48.75, 37.3],
          ],
        ],
      },
    },
  ],
};

