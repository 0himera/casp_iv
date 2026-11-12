import { describe, it } from 'bun:test';
import assert from 'node:assert/strict';
import { SEED_SHIPMENT } from '@/data/caspianSnapshots';
import { applyAttestationTransition } from './attestationTransitions';
import { applyRouteSwitchTransition } from './routeTransitions';
import { applyScenarioTransition } from './scenarioTransitions';

describe('Shipment State Transitions', () => {
  it('spikes risk to 84% during storm and restores to 16% on normal', () => {
    const storm = applyScenarioTransition(SEED_SHIPMENT, 'storm');
    assert.equal(storm.forecast.miss_probability, 0.84);
    assert.equal(storm.routes[0].miss_probability, 0.84);
    assert.equal(storm.routes[1].miss_probability, 0.22);
    assert.ok(storm.forecast.reasons[0].includes('Штормовой фронт'));

    const calm = applyScenarioTransition(storm, 'normal');
    assert.equal(calm.forecast.miss_probability, 0.16);
    assert.equal(calm.routes[0].miss_probability, 0.16);
  });

  it('switches route to Amirabad, drops risk to 22%, and invalidates attestations', () => {
    const initialVersion = SEED_SHIPMENT.passport.version;
    const rerouted = applyRouteSwitchTransition(SEED_SHIPMENT, 'route_makh');
    assert.equal(rerouted.selected_route_id, 'route_makh');
    assert.equal(rerouted.passport.version, initialVersion + 1);
    assert.equal(rerouted.passport.status, 'collecting');
    assert.equal(rerouted.forecast.miss_probability, 0.22);
    assert.equal(rerouted.routes[0].requires_reapproval, true);
    assert.equal(rerouted.routes[1].requires_reapproval, false);

    const invalidated = rerouted.passport.attestations.every(
      (a) => a.status === 'invalidated'
    );
    assert.ok(invalidated);
  });

  it('restores passport status to ready upon verifyAll e-CMR attestation', () => {
    const rerouted = applyRouteSwitchTransition(SEED_SHIPMENT, 'route_makh');
    assert.equal(rerouted.passport.status, 'collecting');

    const verified = applyAttestationTransition(rerouted, 'approved', 'customs', true);
    assert.equal(verified.passport.status, 'ready');
    const roles = ['logistician', 'carrier', 'customs'];
    for (const r of roles) {
      const att = verified.passport.attestations.find(
        (a) => a.role === r && a.version === verified.passport.version
      );
      assert.ok(att);
      assert.equal(att.decision, 'approved');
      assert.equal(att.status, 'active');
    }
  });
});
