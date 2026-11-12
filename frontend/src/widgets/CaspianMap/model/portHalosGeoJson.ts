import type { Feature, FeatureCollection, Point } from 'geojson';

const THERMAL_PORTS: Array<{ id: string; coords: [number, number]; tone: 'thermal' | 'cobalt' }> = [
  { id: 'astrakhan', coords: [48.02, 46.38], tone: 'thermal' },
  { id: 'makhachkala', coords: [47.47, 43.01], tone: 'thermal' },
  { id: 'baku', coords: [49.73, 40.28], tone: 'thermal' },
  { id: 'anzali', coords: [49.47, 37.48], tone: 'thermal' },
  { id: 'amirabad', coords: [53.37, 36.85], tone: 'thermal' },
  { id: 'aktau', coords: [51.23, 43.6], tone: 'cobalt' },
  { id: 'kuryk', coords: [51.75, 43.27], tone: 'cobalt' },
  { id: 'turkmenbashi', coords: [53.01, 40.01], tone: 'cobalt' },
];

export function buildPortHalosGeoJson(stormActive: boolean): FeatureCollection<Point> {
  const features: Feature<Point>[] = THERMAL_PORTS.map((hub) => ({
    type: 'Feature',
    properties: {
      id: hub.id,
      tone: stormActive && hub.id === 'aktau' ? 'thermal' : hub.tone,
    },
    geometry: {
      type: 'Point',
      coordinates: hub.coords,
    },
  }));
  return { type: 'FeatureCollection', features };
}
