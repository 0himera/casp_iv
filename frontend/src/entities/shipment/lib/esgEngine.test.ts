import { describe, expect, it } from 'bun:test';
import { SEED_SHIPMENT } from '@/data/caspianSnapshots';
import { recalculateEsg } from './esgEngine';

function shipment() {
  const s = structuredClone(SEED_SHIPMENT);
  s.routes[0].emissions_kg_co2e = 100;
  s.routes[1].emissions_kg_co2e = 70;
  s.selected_route_id = s.routes[1].id;
  s.planning = {
    scenario: 'normal', assumptions: {}, inputs: [], note: 'scenario', road_baseline_kg_co2e: 200,
    emissions: { shipment_id: s.id, shipment_revision: s.revision, mass_tonnes: s.mass_tonnes,
      factor_source: 'User coefficients', routes: [{route_id: s.routes[1].id,
        total_kg_co2e: 70, by_mode_kg_co2e: {rail: 40, sea: 30}}] },
  };
  return s;
}
describe('ESG from the server projection', () => {
  it('uses selected-route emissions and the same server breakdown', () => {
    const result = recalculateEsg(shipment());
    expect(result.totalCurrentKg).toBe(70);
    expect(result.modesBreakdown.reduce((sum, p) => sum + p.kg, 0)).toBe(70);
    expect(result.deltaVsBaseKg).toBe(-30);
    expect(result.source).toBe('User coefficients');
  });
  it('keeps missing data missing instead of substituting demo emissions', () => {
    const s = shipment();
    s.planning = null;
    s.routes[1].emissions_kg_co2e = null;
    const result = recalculateEsg(s);
    expect(result.totalCurrentKg).toBeNull();
    expect(result.pureRoadBaselineKg).toBeNull();
    expect(result.savedKg).toBeNull();
    expect(result.modesBreakdown).toEqual([]);
  });
});
