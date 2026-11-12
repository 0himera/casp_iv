import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getLeaderLineConfig } from './calloutDirections';

describe('Leader Line Configurations', () => {
  it('returns valid 45-degree vectors for all 5 ports', () => {
    const ports = ['astrakhan', 'makhachkala', 'aktau', 'anzali', 'amirabad'];
    for (const portId of ports) {
      const cfg = getLeaderLineConfig(portId);
      assert.ok(cfg.path.includes('M '));
      assert.ok(cfg.path.includes(' L '));
      assert.equal(typeof cfg.endX, 'number');
      assert.equal(typeof cfg.endY, 'number');
      assert.ok(cfg.calloutStyle);
    }
  });

  it('orients callouts away from the sea into peripheral quadrants', () => {
    const makh = getLeaderLineConfig('makhachkala');
    assert.ok(makh.endX < 0);
    assert.ok(makh.endY < 0);

    const astra = getLeaderLineConfig('astrakhan');
    assert.ok(astra.endX > 0);
    assert.ok(astra.endY < 0);

    const anzali = getLeaderLineConfig('anzali');
    assert.ok(anzali.endX < 0);
    assert.ok(anzali.endY > 0);
  });
});
