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
  useEffect(() => { const id = setInterval(() => setTick((t) => (t + 1) % 120), 45); return () => clearInterval(id); }, []);

  const curvedRoutes = useMemo(() => ({
    ...routeGeoJson,
    features: routeGeoJson.features.map((f) => ({ ...f, properties: { ...(f.properties ?? {}), hovered: f.properties?.id === hoveredRouteId ? 1 : 0 }, geometry: { ...f.geometry, coordinates: smoothSeaArc(f.geometry.coordinates, 0.1) } })),
  }), [routeGeoJson, hoveredRouteId]);

  const pulsePoint: FeatureCollection<Point> = useMemo(() => {
    const pts = routeGeoJson.features.filter((f) => f.properties?.selected === 1).flatMap((f) => smoothSeaArc(f.geometry.coordinates, 0.1));
    if (pts.length < 2) return { type: 'FeatureCollection', features: [] };
    const pos = (tick / 120) * (pts.length - 1), idx = Math.floor(pos), frac = pos - idx, a = pts[idx], b = pts[Math.min(idx + 1, pts.length - 1)];
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac] } }] };
  }, [routeGeoJson, tick]);

  const ringRadius = 6 + (tick % 40) * 0.45, ringOpacity = Math.max(0.05, 0.55 - ((tick % 40) / 40) * 0.5);
  return (
    <>
      <Source id="caspian-water" type="geojson" data="/geo/caspian-water.json"><Layer id="caspian-fill" type="fill" paint={{ 'fill-color': '#2B6E87', 'fill-opacity': 0.88 }} /><Layer id="caspian-shore" type="line" paint={{ 'line-color': '#7EB2CC', 'line-width': 1.2, 'line-opacity': 0.85 }} /></Source>
      <Source id="caspian-bathymetry" type="geojson" data="/geo/caspian-bathymetry.json"><Layer id="bathymetry-fill" type="fill" paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.92 }} /><Layer id="bathymetry-isobath" type="line" paint={{ 'line-color': '#7EB2CC', 'line-width': 0.7, 'line-opacity': 0.28, 'line-dasharray': [3, 3] }} /></Source>
      {showGrid && <Source id="caspian-graticule" type="geojson" data={graticule}><Layer id="graticule-lines" type="line" paint={{ 'line-color': '#7EB2CC', 'line-width': 0.65, 'line-dasharray': [2, 5], 'line-opacity': 0.16 }} /></Source>}
      {showStorm && <Source id="storm-zone" type="geojson" data={stormGeoJson}><Layer id="storm-fill" type="fill" paint={{ 'fill-color': '#D94E34', 'fill-opacity': stormActive ? 0.2 : 0.04 }} /><Layer id="storm-outline" type="line" paint={{ 'line-color': '#D94E34', 'line-width': 1.4, 'line-dasharray': [4, 4] }} /></Source>}
      <Source id="cargo-routes" type="geojson" data={curvedRoutes}>
        <Layer id="alt-route-line" type="line" filter={['==', ['get', 'selected'], 0]} paint={{ 'line-width': ['case', ['==', ['get', 'hovered'], 1], 2.8, 1.5], 'line-color': ['case', ['==', ['get', 'hovered'], 1], '#D98A3C', '#93B9CD'], 'line-dasharray': [4, 3], 'line-opacity': ['case', ['==', ['get', 'hovered'], 1], 0.96, 0.58] }} />
        <Layer id="active-route-casing" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 5, 'line-color': '#06111C', 'line-opacity': 0.85 }} />
        <Layer id="active-route-line" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 2.5, 'line-color': '#D94E34', 'line-opacity': 1 }} />
      </Source>
      <Source id="active-pulse" type="geojson" data={pulsePoint}><Layer id="active-pulse-ring" type="circle" paint={{ 'circle-radius': ringRadius, 'circle-color': '#D94E34', 'circle-opacity': ringOpacity }} /><Layer id="active-pulse-dot" type="circle" paint={{ 'circle-radius': 4.2, 'circle-color': '#F4F1EA', 'circle-stroke-width': 1.8, 'circle-stroke-color': '#D94E34' }} /></Source>
    </>
  );
}
