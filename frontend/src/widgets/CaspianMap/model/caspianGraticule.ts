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

export function smoothSeaArc(coords: number[][], bend = 0.08): number[][] {
  if (coords.length !== 2) return coords;
  const [[x1, y1], [x2, y2]] = coords;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const mx = (x1 + x2) / 2 - dy * bend;
  const my = (y1 + y2) / 2 + dx * bend;
  const out: number[][] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const inv = 1 - t;
    out.push([
      inv * inv * x1 + 2 * inv * t * mx + t * t * x2,
      inv * inv * y1 + 2 * inv * t * my + t * t * y2,
    ]);
  }
  return out;
}
