import { describe, it } from 'bun:test';
import assert from 'node:assert/strict';
import { recalculateEsg, BASE_ROUTE_KG, PURE_ROAD_BASELINE_KG, REROUTED_ROUTE_KG } from './esgEngine';

describe('GLEC Framework v3.0 ESG Engine', () => {
  it('calculates base route emissions (Rating B, -55%)', () => {
    const esg = recalculateEsg('route_astra');
    assert.equal(esg.totalCurrentKg, BASE_ROUTE_KG);
    assert.equal(esg.totalCurrentKg, 2880);
    assert.equal(esg.pureRoadBaselineKg, PURE_ROAD_BASELINE_KG);
    assert.equal(esg.pureRoadBaselineKg, 6420);
    assert.equal(esg.savedKg, 3540);
    assert.equal(esg.reductionPercent, 55);
    assert.equal(esg.deltaVsBaseKg, 0);
    assert.equal(esg.rating, 'B');
    assert.equal(esg.modesBreakdown.length, 3);
    assert.equal(esg.modesBreakdown[0].kg, 1180);
    assert.equal(esg.modesBreakdown[1].kg, 940);
    assert.equal(esg.modesBreakdown[2].kg, 760);
  });

  it('calculates rerouted alternative emissions (Rating A+, -61%)', () => {
    const esg = recalculateEsg('route_makh');
    assert.equal(esg.totalCurrentKg, REROUTED_ROUTE_KG);
    assert.equal(esg.totalCurrentKg, 2520);
    assert.equal(esg.pureRoadBaselineKg, 6420);
    assert.equal(esg.savedKg, 3900);
    assert.equal(esg.reductionPercent, 61);
    assert.equal(esg.deltaVsBaseKg, -360);
    assert.equal(esg.rating, 'A+');
    assert.equal(esg.modesBreakdown[0].kg, 1420);
    assert.equal(esg.modesBreakdown[1].kg, 890);
    assert.equal(esg.modesBreakdown[2].kg, 210);
  });
});
