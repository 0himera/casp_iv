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
      <Source id="storm-zone" type="geojson" data={stormGeoJson}>
        <Layer id="storm-fill" type="fill" paint={{ 'fill-color': palette.danger, 'fill-opacity': stormActive ? 0.18 : 0.08 }} />
        <Layer id="storm-outline" type="line" paint={{ 'line-color': palette.danger, 'line-width': 1.5, 'line-dasharray': [3, 3] }} />
      </Source>
      <Source id="cargo-routes" type="geojson" data={routeGeoJson}>
        <Layer id="alt-route-line" type="line" filter={['==', ['get', 'selected'], 0]} paint={{ 'line-width': 2.5, 'line-color': palette.sea, 'line-dasharray': [4, 3], 'line-opacity': 0.75 }} />
        <Layer id="active-route-line" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 3, 'line-color': palette.rail, 'line-opacity': 0.9 }} />
      </Source>
    </>
  );
}
