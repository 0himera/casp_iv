import earcut, { flatten } from 'earcut';
import type { GeoJSON, Geometry, Polygon } from 'geojson';

function polygons(data: GeoJSON): Polygon['coordinates'][] {
  if (data.type === 'FeatureCollection') return data.features.flatMap(polygons);
  if (data.type === 'Feature') return data.geometry ? polygons(data.geometry) : [];
  if (data.type === 'GeometryCollection') return data.geometries.flatMap(polygons);
  if (data.type === 'Polygon') return [data.coordinates];
  return data.type === 'MultiPolygon' ? data.coordinates : [];
}

export function waterMesh(data: GeoJSON<Geometry>): Float32Array {
  const output: number[] = [];
  for (const polygon of polygons(data)) {
    const rings = polygon.map((ring) => ring.map(([lng, latitude]) => {
      const lat = Math.max(-85.05112878, Math.min(85.05112878, latitude));
      return [(lng + 180) / 360,
        (1 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) / Math.PI) / 2];
    }));
    // Triangulate in the same projection as the map, preserving island holes.
    const { vertices, holes } = flatten(rings);
    for (const index of earcut(vertices, holes, 2)) {
      output.push(vertices[index * 2], vertices[index * 2 + 1]);
    }
  }
  return new Float32Array(output);
}
