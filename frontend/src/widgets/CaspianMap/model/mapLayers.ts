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
    rail: getCssVarColor('--mode-rail', 'transparent'),
    sea: getCssVarColor('--mode-sea', 'transparent'),
    road: getCssVarColor('--mode-road', 'transparent'),
    danger: getCssVarColor('--status-danger', 'transparent'),
    warning: getCssVarColor('--status-warning', 'transparent'),
  };
}
