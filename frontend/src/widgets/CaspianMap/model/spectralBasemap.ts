import { setWorkerUrl, type Map as MapLibreMap } from 'maplibre-gl';
import { getCssVarColor } from '@/shared/lib/theme-colors';

export const SPECTRAL_BASE_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export function initMapLibreWorker() {
  if (typeof window !== 'undefined') setWorkerUrl('/maplibre-gl-worker.mjs');
}

export function applySpectralBasemapTheme(map: MapLibreMap) {
  const style = map.getStyle();
  if (!style?.layers) return;
  const colors = {
    background: getCssVarColor('--map-background', 'transparent'),
    land: getCssVarColor('--map-land', 'transparent'),
    landUse: getCssVarColor('--map-land-use', 'transparent'),
    water: getCssVarColor('--map-water', 'transparent'),
    boundary: getCssVarColor('--map-boundary', 'transparent'),
    road: getCssVarColor('--map-road', 'transparent'),
    label: getCssVarColor('--map-label', 'transparent'),
  };

  for (const layer of style.layers) {
    const id = layer.id.toLowerCase();
    if (layer.type === 'background') {
      map.setPaintProperty(layer.id, 'background-color', colors.background);
    } else if (layer.type === 'fill' && id.includes('water')) {
      map.setPaintProperty(layer.id, 'fill-color', colors.water);
    } else if (layer.type === 'fill' && (id.includes('park') || id.includes('landcover') || id.includes('landuse'))) {
      map.setPaintProperty(layer.id, 'fill-color', colors.landUse);
    } else if (layer.type === 'fill') {
      map.setPaintProperty(layer.id, 'fill-color', colors.land);
    } else if (layer.type === 'line' && id.includes('disputed')) {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
    } else if (id.includes('poi') || id.includes('building')) {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
    } else if (layer.type === 'line' && (id.includes('boundary') || id.includes('admin'))) {
      map.setPaintProperty(layer.id, 'line-color', colors.boundary);
      map.setPaintProperty(layer.id, 'line-opacity', 0.72);
    } else if (layer.type === 'line' && (id.includes('waterway') || id.includes('water-line'))) {
      map.setPaintProperty(layer.id, 'line-color', colors.boundary);
    } else if (layer.type === 'line' && (id.includes('road') || id.includes('highway') || id.includes('street'))) {
      map.setPaintProperty(layer.id, 'line-color', colors.road);
      map.setPaintProperty(layer.id, 'line-opacity', 0.72);
    } else if (layer.type === 'symbol') {
      map.setPaintProperty(layer.id, 'text-color', colors.label);
      map.setPaintProperty(layer.id, 'text-halo-color', colors.background);
      map.setPaintProperty(layer.id, 'text-halo-width', 1.25);
    }
  }
}
