import type { FeatureCollection, LineString } from 'geojson';
import type { RouteSegment } from '@/entities/cargo';
import { getCssVarColor } from '@/shared/lib/theme-colors';

export function buildRouteGeoJson(
  segments: RouteSegment[]
): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: segments.map((seg, index) => ({
      type: 'Feature',
      properties: { id: index, mode: seg.mode },
      geometry: { type: 'LineString', coordinates: seg.coordinates },
    })),
  };
}

export function resolveMapPalette() {
  return {
    rail: getCssVarColor('--mode-rail', '#7d99aa'),
    sea: getCssVarColor('--mode-sea', '#67857b'),
    road: getCssVarColor('--mode-road', '#c49a5c'),
    danger: getCssVarColor('--status-danger', '#cf6a46'),
    warning: getCssVarColor('--status-warning', '#c49a5c'),
  };
}
