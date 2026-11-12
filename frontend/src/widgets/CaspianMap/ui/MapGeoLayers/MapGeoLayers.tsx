'use client';

import { useEffect, useMemo, useState } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { FeatureCollection, LineString, Point } from 'geojson';
import { CALM_ZONE_GEOJSON, STORM_ZONE_GEOJSON } from '@/data/mockTransitData';
import { buildCaspianGraticule, smoothSeaArc } from '../../model/caspianGraticule';

interface MapGeoLayersProps {
  stormActive: boolean; routeGeoJson: FeatureCollection<LineString>;
  hoveredRouteId?: string | null; showGrid?: boolean; showStorm?: boolean;
}

export function MapGeoLayers({ stormActive, routeGeoJson, hoveredRouteId, showGrid = true, showStorm = true }: MapGeoLayersProps) {
  const stormGeoJson = stormActive ? STORM_ZONE_GEOJSON : CALM_ZONE_GEOJSON;
  const graticule = useMemo(() => buildCaspianGraticule(), []);
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => (t + 1) % 100), 90); return () => clearInterval(id); }, []);

  const curvedRoutes = useMemo(() => ({
    ...routeGeoJson,
    features: routeGeoJson.features.map((f) => ({
      ...f,
      properties: { ...(f.properties ?? {}), hovered: f.properties?.id === hoveredRouteId ? 1 : 0 },
      geometry: { ...f.geometry, coordinates: smoothSeaArc(f.geometry.coordinates, 0.1) },
    })),
  }), [routeGeoJson, hoveredRouteId]);

  const pulsePoint: FeatureCollection<Point> = useMemo(() => {
    const activePts = routeGeoJson.features.filter((f) => f.properties?.selected === 1).flatMap((f) => smoothSeaArc(f.geometry.coordinates, 0.1));
    if (!activePts.length) return { type: 'FeatureCollection', features: [] };
    const coord = activePts[Math.min(activePts.length - 1, Math.floor((tick / 100) * activePts.length))];
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coord } }] };
  }, [routeGeoJson, tick]);

  return (
    <>
      {showGrid && <Source id="caspian-graticule" type="geojson" data={graticule}><Layer id="graticule-lines" type="line" paint={{ 'line-color': '#4E7A94', 'line-width': 0.75, 'line-dasharray': [2, 5], 'line-opacity': 0.22 }} /></Source>}
      <Source id="caspian-water" type="geojson" data="/geo/caspian-water.json">
        <Layer id="caspian-fill" type="fill" paint={{ 'fill-color': '#0E2438', 'fill-opacity': 0.84 }} />
        <Layer id="caspian-shore" type="line" paint={{ 'line-color': '#567F99', 'line-width': 1.25, 'line-opacity': 0.72 }} />
      </Source>
      {showStorm && <Source id="storm-zone" type="geojson" data={stormGeoJson}>
        <Layer id="storm-fill" type="fill" paint={{ 'fill-color': '#D94E34', 'fill-opacity': stormActive ? 0.16 : 0.04 }} />
        <Layer id="storm-outline" type="line" paint={{ 'line-color': '#D94E34', 'line-width': 1.25, 'line-dasharray': [4, 4] }} />
      </Source>}
      <Source id="cargo-routes" type="geojson" data={curvedRoutes}>
        <Layer id="alt-route-line" type="line" filter={['==', ['get', 'selected'], 0]} paint={{ 'line-width': ['case', ['==', ['get', 'hovered'], 1], 2.8, 1.5], 'line-color': ['case', ['==', ['get', 'hovered'], 1], '#D98A3C', '#64889E'], 'line-dasharray': [4, 3], 'line-opacity': ['case', ['==', ['get', 'hovered'], 1], 0.95, 0.62] }} />
        <Layer id="active-route-casing" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 4.5, 'line-color': '#080C14', 'line-opacity': 0.85 }} />
        <Layer id="active-route-line" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 2.4, 'line-color': '#D94E34', 'line-opacity': 0.98 }} />
      </Source>
      <Source id="active-pulse" type="geojson" data={pulsePoint}><Layer id="active-pulse-dot" type="circle" paint={{ 'circle-radius': 4, 'circle-color': '#F4F1EA', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#D94E34' }} /></Source>
    </>
  );
}
