import { describe, expect, it } from 'bun:test';
import { SEED_SHIPMENT } from '@/data/caspianSnapshots';
import { actionsForRole } from '@/entities/shipment/lib/permissions';
import { createCaspianClient, type Operation } from '@/shared/api/caspian';
import { buildCommandHandlers } from './commandCenterRemote';

describe('confirmed passport projection', () => {
  it('does not invent signatures, hashes or route changes before a server response', () => {
    const shipment = structuredClone(SEED_SHIPMENT);
    shipment.passport.network = 'casper-test';
    const before = structuredClone(shipment);
    const pending: Array<() => Promise<Operation>> = [];
    const handlers = buildCommandHandlers({shipment, role: 'customs',
      client: createCaspianClient('/api/backend', () => 'customs'), runRemote: (fn) => { pending.push(fn); }});
    handlers.attest('approved');
    handlers.revoke();
    handlers.verifyEcmr();
    handlers.selectRoute(shipment.routes[1].id);
    handlers.replaceDocument('doc', 'new.txt', 'YWJj');
    expect(pending).toHaveLength(5);
    expect(shipment).toEqual(before);
  });
  it('only offers logistical changes to the logistician and one decision per role/version', () => {
    const s = structuredClone(SEED_SHIPMENT);
    s.allowed_actions = ['select_route', 'replace_document', 'attest', 'run_scenario'];
    s.passport.attestations = [{ role: 'carrier', version: s.passport.version,
      decision: 'approved', status: 'expired', valid_until: '2020-01-01T00:00:00Z' }];
    expect(actionsForRole(s, 'carrier')).toEqual([]);
    expect(actionsForRole(s, 'customs')).toEqual(['attest']);
    expect(actionsForRole(s, 'logistician')).toEqual(s.allowed_actions);
  });
});
