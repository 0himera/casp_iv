'use client';

import { Layer, Source } from 'react-map-gl/maplibre';
import type { FeatureCollection, LineString } from 'geojson';
import { CALM_ZONE_GEOJSON, STORM_ZONE_GEOJSON } from '@/data/mockTransitData';

interface MapGeoLayersProps {
  stormActive: boolean;
  routeGeoJson: FeatureCollection<LineString>;
  palette: { danger: string; sea: string; rail: string };
}

export function MapGeoLayers({ stormActive, routeGeoJson, palette }: MapGeoLayersProps) {
  const stormGeoJson = stormActive ? STORM_ZONE_GEOJSON : CALM_ZONE_GEOJSON;

  return (
    <>
      <Source id="caspian-water" type="geojson" data="/geo/caspian-water.json">
        <Layer id="caspian-fill" type="fill" paint={{ 'fill-color': '#0E4866', 'fill-opacity': 0.58 }} />
        <Layer id="caspian-halo" type="line" paint={{ 'line-color': '#255BFF', 'line-width': 6, 'line-opacity': 0.18, 'line-blur': 4 }} />
        <Layer id="caspian-shore" type="line" paint={{ 'line-color': '#00F0FF', 'line-width': 1.1, 'line-opacity': 0.55 }} />
      </Source>
      <Source id="storm-zone" type="geojson" data={stormGeoJson}>
        <Layer id="storm-fill" type="fill" paint={{ 'fill-color': palette.danger, 'fill-opacity': stormActive ? 0.22 : 0.05 }} />
        <Layer id="storm-outline" type="line" paint={{ 'line-color': palette.danger, 'line-width': 1.5, 'line-dasharray': [4, 4] }} />
      </Source>
      <Source id="cargo-routes" type="geojson" data={routeGeoJson}>
        <Layer id="alt-route-line" type="line" filter={['==', ['get', 'selected'], 0]} paint={{ 'line-width': 1.6, 'line-color': '#00F0FF', 'line-dasharray': [4, 4], 'line-opacity': 0.55 }} />
        <Layer id="active-route-glow" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 7, 'line-color': '#FF3B1D', 'line-opacity': 0.28, 'line-blur': 4 }} />
        <Layer id="active-route-line" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 2.5, 'line-color': '#FF3B1D', 'line-opacity': 0.98 }} />
      </Source>
    </>
  );
}
