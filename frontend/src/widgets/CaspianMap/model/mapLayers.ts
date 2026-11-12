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
    rail: getCssVarColor('--mode-rail', '#8096a5'),
    sea: getCssVarColor('--mode-sea', '#6e8c82'),
    road: getCssVarColor('--mode-road', '#b89b6a'),
    danger: getCssVarColor('--status-danger', '#ba735b'),
    warning: getCssVarColor('--status-warning', '#b89b6a'),
  };
}
