import { describe, expect, it } from 'bun:test';
import { SEED_SHIPMENT } from '@/data/caspianSnapshots';
import { actionsForRole } from './permissions';

describe('revocation permission matches the contract', () => {
  it('allows only the owning role with a live approval in the current version', () => {
    const s = structuredClone(SEED_SHIPMENT);
    s.allowed_actions = ['attest', 'revoke'];
    s.passport.attestations = [{ role: 'carrier', version: s.passport.version, decision: 'approved', status: 'active', valid_until: new Date(Date.now() + 60000).toISOString() }];
    expect(actionsForRole(s, 'carrier')).toEqual(['revoke']);
    expect(actionsForRole(s, 'customs')).toEqual(['attest']);
    s.passport.attestations[0].status = 'revoked';
    expect(actionsForRole(s, 'carrier')).toEqual([]);
    s.passport.attestations[0].status = 'active';
    s.passport.attestations[0].valid_until = '2020-01-01T00:00:00Z';
    expect(actionsForRole(s, 'carrier')).toEqual([]);
    s.passport.attestations[0].version--;
    expect(actionsForRole(s, 'carrier')).toEqual(['attest']);
    s.allowed_actions = [];
    expect(actionsForRole(s, 'carrier')).toEqual([]);
  });
});
