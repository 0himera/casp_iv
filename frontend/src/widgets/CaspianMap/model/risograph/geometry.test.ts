import { expect, it } from 'bun:test';
import type { Polygon } from 'geojson';
import { waterMesh } from './geometry';

function area(mesh: Float32Array) {
  let result = 0;
  for (let i = 0; i < mesh.length; i += 6) {
    const [x1, y1, x2, y2, x3, y3] = mesh.slice(i, i + 6);
    result += Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)) / 2;
  }
  return result;
}
it('preserves island holes rather than printing a filled bounding box over land', () => {
  const outer = [[-10,-10],[10,-10],[10,10],[-10,10],[-10,-10]];
  const island = [[-2,-2],[-2,2],[2,2],[2,-2],[-2,-2]];
  const polygon: Polygon = { type: 'Polygon', coordinates: [outer] };
  const filled = waterMesh(polygon);
  const water = waterMesh({ ...polygon, coordinates: [outer, island] });
  const ratio = area(water) / area(filled);
  expect(ratio).toBeGreaterThan(0.95);
  expect(ratio).toBeLessThan(0.97);
  expect([...water].every(Number.isFinite)).toBe(true);
  expect(water.length % 6).toBe(0);
  expect(waterMesh({type:'LineString',coordinates:outer})).toHaveLength(0);
});
