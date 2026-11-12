import geometry from '@/data/marineRoutes.json';

export function portId(value: string): string | undefined {
  return (geometry.aliases as Record<string, string>)[value];
}
export function portCoordinate(value: string): number[] | undefined {
  const id = portId(value);
  return id ? (geometry.ports as Record<string, number[]>)[id] : undefined;
}
export function seaRoute(from: string, to: string): number[][] | null {
  const a = portId(from), b = portId(to);
  if (!a || !b || a === b) return null;
  const key = [a, b].sort().join('|');
  const points = (geometry.routes as Record<string, number[][]>)[key];
  return points ? a < b ? points : [...points].reverse() : null;
}
