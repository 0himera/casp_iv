import type { Feature, FeatureCollection, LineString } from 'geojson';

export function buildCaspianGraticule(): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = [];
  for (let lon = 45; lon <= 56; lon += 2) {
    features.push({
      type: 'Feature',
      properties: { axis: 'lon' },
      geometry: { type: 'LineString', coordinates: [[lon, 35.5], [lon, 48.0]] },
    });
  }
  for (let lat = 36; lat <= 48; lat += 2) {
    features.push({
      type: 'Feature',
      properties: { axis: 'lat' },
      geometry: { type: 'LineString', coordinates: [[45.0, lat], [56.0, lat]] },
    });
  }
  return { type: 'FeatureCollection', features };
}
