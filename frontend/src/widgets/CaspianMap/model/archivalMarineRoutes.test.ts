import { describe, expect, it } from 'bun:test';
import { seaRoute } from '@/entities/shipment/lib/marineGeometry';
import { ARCHIVAL_MARINE_ROUTES } from './archivalMarineRoutes';
import { projectArchivalCoord } from './archivalPins';

describe('SVG maritime routes', () => {
  it('renders all 28 coastal connections without unsupported river approaches', () => {
    expect(ARCHIVAL_MARINE_ROUTES).toHaveLength(28);
    expect(ARCHIVAL_MARINE_ROUTES.some((r) => r.from === 'astrakhan' || r.to === 'astrakhan')).toBe(false);
  });

  it('preserves every water-route waypoint without decorative curves or shortcuts', () => {
    for (const route of ARCHIVAL_MARINE_ROUTES) {
      const points = seaRoute(route.from, route.to)!;
      const commands = route.d.match(/[A-Za-z]/g);
      expect(commands).toEqual(['M', ...points.slice(1).map(() => 'L')]);
      const rendered = route.d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      expect(rendered).toEqual(points.flatMap(([lng, lat]) => {
        const p = projectArchivalCoord(lng, lat);
        return [p.x, p.y];
      }));
    }
  });
});
