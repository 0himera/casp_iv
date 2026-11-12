import archivalGeo from '@/data/archivalVectorMap.json';
import type { CaspianPort } from '@/entities/cargo';

export interface ArchivalPortGeo {
  id: string;
  name: string;
  country: string;
  lng: number;
  lat: number;
  x: number;
  y: number;
  labelDx: number;
  labelDy: number;
  anchor: 'start' | 'end';
}

export const ARCHIVAL_GEO = archivalGeo;
export const ARCHIVAL_PORTS = archivalGeo.ports as ArchivalPortGeo[];

export function projectArchivalCoord(lng: number, lat: number) {
  const { latMax, lngMax, cosLat, scale, ox, oy } = archivalGeo.projParams;
  return {
    x: Number((ox + (latMax - lat) * scale).toFixed(1)),
    y: Number((oy + (lngMax - lng) * cosLat * scale).toFixed(1)),
  };
}

export function resolveArchivalPort(geo: ArchivalPortGeo, livePorts: CaspianPort[]): CaspianPort {
  const found = livePorts.find((p) => p.id === geo.id);
  if (found) return found;
  return {
    id: geo.id,
    name: geo.name,
    country: geo.country,
    lat: geo.lat,
    lng: geo.lng,
    loadPercent: 54,
    berthsAvailable: 4,
    totalBerths: 10,
    vesselsInRoadstead: 3,
    waveHeightM: 1.0,
    windSpeedKmh: 15,
    windDirectionDeg: 315,
    windDirectionLabel: 'NW',
    waterDepthM: 7.5,
    status: 'operational',
    archiveIndex: `[ ARCH // ${geo.id.toUpperCase()} ]`,
  };
}
