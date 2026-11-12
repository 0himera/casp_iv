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
    rail: getCssVarColor('--mode-rail', '#3b82f6'),
    sea: getCssVarColor('--mode-sea', '#06b6d4'),
    road: getCssVarColor('--mode-road', '#f59e0b'),
    danger: getCssVarColor('--status-danger', '#ef4444'),
    warning: getCssVarColor('--status-warning', '#f59e0b'),
  };
}

