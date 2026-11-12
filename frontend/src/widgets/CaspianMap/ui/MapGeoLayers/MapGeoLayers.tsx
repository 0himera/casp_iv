'use client';

import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { FeatureCollection, LineString, Point } from 'geojson';
import { CALM_ZONE_GEOJSON, STORM_ZONE_GEOJSON } from '@/data/mockTransitData';
import { getCssVarColor } from '@/shared/lib/theme-colors';
import { buildCaspianGraticule } from '../../model/caspianGraticule';

const CRIMEA_LABEL: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { label: 'КРЫМ · РОССИЯ' },
    geometry: { type: 'Point', coordinates: [34.1, 45.15] },
  }],
};

interface MapGeoLayersProps {
  stormActive: boolean; routeGeoJson: FeatureCollection<LineString>;
  hoveredRouteId?: string | null; showGrid?: boolean; showStorm?: boolean;
}

export function MapGeoLayers({ stormActive, routeGeoJson, hoveredRouteId, showGrid = true, showStorm = true }: MapGeoLayersProps) {
  const stormGeoJson = stormActive ? STORM_ZONE_GEOJSON : CALM_ZONE_GEOJSON;
  const palette = useMemo(() => ({
    water: getCssVarColor('--map-water', 'transparent'),
    shallow: getCssVarColor('--map-shallow', 'transparent'),
    midDepth: getCssVarColor('--map-mid-depth', 'transparent'),
    deep: getCssVarColor('--map-deep', 'transparent'),
    deepest: getCssVarColor('--map-deepest', 'transparent'),
    shore: getCssVarColor('--map-shore', 'transparent'),
    contour: getCssVarColor('--map-contour', 'transparent'),
    grid: getCssVarColor('--map-grid', 'transparent'),
    primary: getCssVarColor('--primary', 'transparent'),
    warning: getCssVarColor('--status-warning', 'transparent'),
    routeAlt: getCssVarColor('--accent-cyan', 'transparent'),
    routeCasing: getCssVarColor('--map-background', 'transparent'),
    surface: getCssVarColor('--surface-default', 'transparent'),
  }), []);
  const graticule = useMemo(() => buildCaspianGraticule(), []);
  const displayRoutes = useMemo(() => ({
    ...routeGeoJson,
    features: routeGeoJson.features.map((f) => ({ ...f, properties: { ...(f.properties ?? {}), hovered: f.properties?.id === hoveredRouteId ? 1 : 0 }, geometry: f.geometry })),
  }), [routeGeoJson, hoveredRouteId]);

  return (
    <>
      <Source id="caspian-water" type="geojson" data="/geo/caspian-water.json"><Layer id="caspian-fill" type="fill" paint={{ 'fill-color': palette.water, 'fill-opacity': 0.95 }} /><Layer id="caspian-shore" type="line" paint={{ 'line-color': palette.shore, 'line-width': 1.2, 'line-opacity': 0.82 }} /></Source>
      <Source id="crimea-label-source" type="geojson" data={CRIMEA_LABEL}>
        <Layer
          id="crimea-russia-label"
          type="symbol"
          layout={{
            'text-field': ['get', 'label'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 6, 13, 9, 15],
            'text-letter-spacing': 0.06,
            'text-max-width': 10,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          }}
          paint={{
            'text-color': palette.primary,
            'text-halo-color': palette.routeCasing,
            'text-halo-width': 2,
          }}
        />
      </Source>
      <Source id="caspian-bathymetry" type="geojson" data="/geo/caspian-bathymetry.json"><Layer id="bathymetry-fill" type="fill" paint={{ 'fill-color': ['match', ['get', 'depth_m'], 15, palette.shallow, 180, palette.midDepth, 450, palette.deep, 1025, palette.deepest, palette.midDepth], 'fill-opacity': 0.92 }} /><Layer id="bathymetry-isobath" type="line" paint={{ 'line-color': palette.contour, 'line-width': 0.7, 'line-opacity': 0.58, 'line-dasharray': [3, 3] }} /></Source>
      {showGrid && <Source id="caspian-graticule" type="geojson" data={graticule}><Layer id="graticule-lines" type="line" paint={{ 'line-color': palette.grid, 'line-width': 0.65, 'line-dasharray': [2, 5], 'line-opacity': 0.6 }} /></Source>}
      {showStorm && <Source id="storm-zone" type="geojson" data={stormGeoJson}><Layer id="storm-fill" type="fill" paint={{ 'fill-color': palette.primary, 'fill-opacity': stormActive ? 0.2 : 0.04 }} /><Layer id="storm-outline" type="line" paint={{ 'line-color': palette.primary, 'line-width': 1.4, 'line-dasharray': [4, 4] }} /></Source>}
      <Source id="cargo-routes" type="geojson" data={displayRoutes}>
        <Layer id="alt-route-line" type="line" filter={['==', ['get', 'selected'], 0]} paint={{ 'line-width': ['case', ['==', ['get', 'hovered'], 1], 2.8, 1.5], 'line-color': ['case', ['==', ['get', 'hovered'], 1], palette.warning, palette.routeAlt], 'line-dasharray': [4, 3], 'line-opacity': ['case', ['==', ['get', 'hovered'], 1], 0.96, 0.72] }} />
        <Layer id="active-route-casing" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 5, 'line-color': palette.routeCasing, 'line-opacity': 0.95 }} />
        <Layer id="active-route-line" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 2.5, 'line-color': palette.primary, 'line-opacity': 1 }} />
      </Source>
    </>
  );
}
