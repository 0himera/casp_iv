import { describe, it, expect } from 'bun:test';
import { seaRoute } from './marineGeometry';

describe('sea geometry', () => {
  it('uses prevalidated water geometry and reverses it for the return direction', () => {
    const forward = seaRoute('Курык', 'Энзели');
    expect(forward).not.toBeNull();
    expect(seaRoute('anzali', 'kuryk')).toEqual([...forward!].reverse());
  });
  it('never substitutes a straight line for a missing river approach or unknown port', () => {
    expect(seaRoute('astrakhan', 'anzali')?.[0][1]).toBeLessThan(45);
    expect(seaRoute('astrakhan', 'olya')).toBeNull();
    expect(seaRoute('alat', 'aktau')).not.toBeNull();
    expect(seaRoute('not-a-port', 'aktau')).toBeNull();
  });
});
