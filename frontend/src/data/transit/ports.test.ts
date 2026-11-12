import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CASPIAN_PORTS } from './ports';
import { resolvePortTelemetry } from '@/entities/cargo';

describe('Caspian Ports Telemetry Data', () => {
  it('contains exactly 5 Caspian ports with complete telemetry', () => {
    assert.equal(CASPIAN_PORTS.length, 5);
    const ids = CASPIAN_PORTS.map((p) => p.id);
    assert.deepEqual(ids, ['astrakhan', 'makhachkala', 'aktau', 'anzali', 'amirabad']);

    for (const port of CASPIAN_PORTS) {
      assert.ok(port.waveHeightM > 0);
      assert.ok(port.windSpeedKmh > 0);
      assert.ok(port.totalBerths > 0);
      assert.ok(port.berthsAvailable >= 0);
      const expected = port.country === 'РФ' ? 'RU' : port.country === 'РК' ? 'KZ' : 'IR';
      assert.ok(port.archiveIndex.includes(expected));
    }
  });

  it('updates Anzali to storm_restricted when storm is active', () => {
    const anzali = CASPIAN_PORTS.find((p) => p.id === 'anzali')!;
    const calm = resolvePortTelemetry(anzali, false);
    assert.equal(calm.status, 'congested');
    assert.equal(calm.waveHeightM, 1.4);

    const storm = resolvePortTelemetry(anzali, true);
    assert.equal(storm.status, 'storm_restricted');
    assert.equal(storm.waveHeightM, 3.8);
    assert.equal(storm.windSpeedKmh, 62);
    assert.equal(storm.berthsAvailable, 0);
  });
});
