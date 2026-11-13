import { expect, test } from 'bun:test';
import type { Map } from 'maplibre-gl';
import { applySpectralBasemapTheme } from './spectralBasemap';

test('basemap theming preserves the independently styled water, weather and route overlays', () => {
  const touched: string[] = [];
  const map = {
    getStyle: () => ({
      sources: { tiles: { type: 'vector' }, water: { type: 'geojson' }, routes: { type: 'geojson' }, weather: { type: 'geojson' } },
      layers: [
        { id: 'background', type: 'background' },
        { id: 'landcover', type: 'fill', source: 'tiles' },
        { id: 'water', type: 'fill', source: 'tiles' },
        { id: 'bathymetry-fill', type: 'fill', source: 'water' },
        { id: 'active-route-line', type: 'line', source: 'routes' },
        { id: 'storm-fill', type: 'fill', source: 'weather' },
        { id: 'caspian-risograph', type: 'custom' },
      ],
    }),
    setPaintProperty: (id: string) => touched.push(id),
    setLayoutProperty: (id: string) => touched.push(id),
  };
  applySpectralBasemapTheme(map as unknown as Map);
  expect(touched).toEqual(['background', 'landcover', 'water']);
});
