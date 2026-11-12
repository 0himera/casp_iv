import type { CaspianPort } from '@/entities/cargo';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function findNearestPort(lng: number, lat: number, ports: CaspianPort[]) {
  let best: { port: CaspianPort; distanceKm: number } | null = null;
  for (const port of ports) {
    const distanceKm = haversineKm(lat, lng, port.lat, port.lng);
    if (!best || distanceKm < best.distanceKm) best = { port, distanceKm };
  }
  return best;
}

