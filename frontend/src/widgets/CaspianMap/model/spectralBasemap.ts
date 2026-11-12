import { setWorkerUrl, type Map as MapLibreMap } from 'maplibre-gl';

export const SPECTRAL_BASE_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export function initMapLibreWorker() {
  if (typeof window !== 'undefined') setWorkerUrl('/maplibre-gl-worker.mjs');
}

export function applySpectralBasemapTheme(map: MapLibreMap) {
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    const id = layer.id.toLowerCase();
    if (layer.type === 'background') {
      map.setPaintProperty(layer.id, 'background-color', '#170205');
    } else if (layer.type === 'fill' && id.includes('water')) {
      map.setPaintProperty(layer.id, 'fill-color', '#061220');
    } else if (layer.type === 'fill') {
      map.setPaintProperty(layer.id, 'fill-color', '#260409');
    } else if (id.includes('road') || id.includes('tunnel') || id.includes('bridge') || id.includes('poi') || id.includes('building')) {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
    } else if (layer.type === 'line' && (id.includes('boundary') || id.includes('admin'))) {
      map.setPaintProperty(layer.id, 'line-color', '#6A1020');
      map.setPaintProperty(layer.id, 'line-opacity', 0.65);
    } else if (layer.type === 'symbol') {
      map.setPaintProperty(layer.id, 'text-color', '#E8CCD2');
      map.setPaintProperty(layer.id, 'text-halo-color', '#170205');
      map.setPaintProperty(layer.id, 'text-halo-width', 1.5);
    }
  }
}
