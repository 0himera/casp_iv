'use client';

import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { FeatureCollection, LineString } from 'geojson';
import { CALM_ZONE_GEOJSON, STORM_ZONE_GEOJSON } from '@/data/mockTransitData';
import { buildCaspianGraticule, smoothSeaArc } from '../../model/caspianGraticule';
import { buildPortHalosGeoJson } from '../../model/portHalosGeoJson';

interface MapGeoLayersProps {
  stormActive: boolean;
  routeGeoJson: FeatureCollection<LineString>;
  palette: { danger: string; sea: string; rail: string };
}

export function MapGeoLayers({ stormActive, routeGeoJson, palette }: MapGeoLayersProps) {
  const stormGeoJson = stormActive ? STORM_ZONE_GEOJSON : CALM_ZONE_GEOJSON;
  const graticule = useMemo(() => buildCaspianGraticule(), []);
  const halos = useMemo(() => buildPortHalosGeoJson(stormActive), [stormActive]);
  const curvedRoutes = useMemo(() => ({
    ...routeGeoJson,
    features: routeGeoJson.features.map((f) => ({
      ...f,
      geometry: { ...f.geometry, coordinates: smoothSeaArc(f.geometry.coordinates, 0.1) },
    })),
  }), [routeGeoJson]);

  return (
    <>
      <Source id="caspian-graticule" type="geojson" data={graticule}>
        <Layer id="graticule-lines" type="line" paint={{ 'line-color': '#00F0FF', 'line-width': 0.75, 'line-dasharray': [2, 5], 'line-opacity': 0.16 }} />
      </Source>
      <Source id="caspian-water" type="geojson" data="/geo/caspian-water.json">
        <Layer id="caspian-halo" type="line" paint={{ 'line-color': '#1238B4', 'line-width': 18, 'line-opacity': 0.42, 'line-blur': 14 }} />
        <Layer id="caspian-fill" type="fill" paint={{ 'fill-color': '#0B3A57', 'fill-opacity': 0.78 }} />
        <Layer id="caspian-amber-shore" type="line" paint={{ 'line-color': '#FF8A00', 'line-width': 3.5, 'line-opacity': 0.34, 'line-blur': 2.5 }} />
        <Layer id="caspian-shore" type="line" paint={{ 'line-color': '#00F0FF', 'line-width': 1.35, 'line-opacity': 0.85 }} />
      </Source>
      <Source id="caspian-port-halos" type="geojson" data={halos}>
        <Layer id="port-halo-bloom" type="circle" paint={{ 'circle-radius': 54, 'circle-blur': 1, 'circle-color': ['case', ['==', ['get', 'tone'], 'thermal'], '#FF3B1D', '#255BFF'], 'circle-opacity': 0.28 }} />
      </Source>
      <Source id="storm-zone" type="geojson" data={stormGeoJson}>
        <Layer id="storm-fill" type="fill" paint={{ 'fill-color': palette.danger, 'fill-opacity': stormActive ? 0.24 : 0.04 }} />
        <Layer id="storm-outline" type="line" paint={{ 'line-color': palette.danger, 'line-width': 1.4, 'line-dasharray': [4, 4] }} />
      </Source>
      <Source id="cargo-routes" type="geojson" data={curvedRoutes}>
        <Layer id="alt-route-line" type="line" filter={['==', ['get', 'selected'], 0]} paint={{ 'line-width': 1.6, 'line-color': '#00F0FF', 'line-dasharray': [4, 4], 'line-opacity': 0.65 }} />
        <Layer id="active-route-aura" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 14, 'line-color': '#FF3B1D', 'line-opacity': 0.22, 'line-blur': 8 }} />
        <Layer id="active-route-glow" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 5, 'line-color': '#FF8A00', 'line-opacity': 0.45, 'line-blur': 2 }} />
        <Layer id="active-route-line" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 2.5, 'line-color': '#FF3B1D', 'line-opacity': 1 }} />
      </Source>
    </>
  );
}
