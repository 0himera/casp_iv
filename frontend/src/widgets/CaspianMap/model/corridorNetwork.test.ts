import { describe, it, expect } from 'bun:test';
import type { Corridor } from '../../../../../api/public-data.types';
import { findConnections } from './corridorNetwork';

const edge = (a: string, b: string): Corridor => ({ id: `${a}-${b}`, port_ids: [a, b], source_url: 'https://example.com', evidence: 'test' });
describe('published connectivity', () => {
  it('finds direct and reverse connections without inventing links', () => {
    const edges = [edge('aktau', 'amirabad'), edge('aktau', 'makhachkala')];
    expect(findConnections(edges, 'amirabad', 'aktau')[0]).toHaveLength(1);
    expect(findConnections(edges, 'makhachkala', 'amirabad')[0]).toHaveLength(2);
    expect(findConnections(edges, 'astrakhan', 'amirabad')).toEqual([]);
  });
  it('avoids cycles and returns no path to the same port', () => {
    const edges = [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')];
    expect(findConnections(edges, 'a', 'a')).toEqual([]);
    expect(findConnections(edges, 'a', 'c').map((p) => p.length)).toEqual([1, 2]);
  });
});
