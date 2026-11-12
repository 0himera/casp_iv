import type { Corridor } from '../../../../../api/public-data.types';

// Catalog links are undirected connectivity, not verified operating services.
export function findConnections(edges: Corridor[], from: string, to: string): Corridor[][] {
  if (!from || !to || from === to) return [];
  const results: Corridor[][] = [];
  const visit = (port: string, seen: Set<string>, path: Corridor[]) => {
    if (path.length >= 3 || results.length >= 20) return;
    for (const edge of edges) {
      if (!edge.port_ids.includes(port)) continue;
      const next = edge.port_ids.find((id) => id !== port);
      if (!next || seen.has(next)) continue;
      const extended = [...path, edge];
      if (next === to) results.push(extended);
      else visit(next, new Set([...seen, next]), extended);
    }
  };
  visit(from, new Set([from]), []);
  return results.sort((a, b) => a.length - b.length);
}
