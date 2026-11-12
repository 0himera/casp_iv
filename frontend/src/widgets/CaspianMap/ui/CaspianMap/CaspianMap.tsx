'use client';

import { useMemo } from 'react';
import { setWorkerUrl } from 'maplibre-gl';
import Map, { Layer, NavigationControl, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CALM_ZONE_GEOJSON, STORM_ZONE_GEOJSON } from '@/data/mockTransitData';
import type { CaspianPort } from '@/entities/cargo';
import { buildMapRoutesGeoJson } from '@/entities/shipment';
import type { Shipment } from '@/shared/api/caspian';
import { BioOpticOrbits } from '@/shared/ui';
import { resolveMapPalette } from '../../model/mapLayers';
import { MapLegend } from '../MapLegend';
import { PortMarkers } from '../PortMarkers';
import styles from './CaspianMap.module.css';

interface CaspianMapProps {
  ports: CaspianPort[];
  shipment: Shipment;
  stormActive: boolean;
  xrayMode?: boolean;
}

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
if (typeof window !== 'undefined') setWorkerUrl('/maplibre-gl-worker.mjs');

export function CaspianMap({ ports, shipment, stormActive, xrayMode = false }: CaspianMapProps) {
  const palette = useMemo(() => resolveMapPalette(), []);
  const routeGeoJson = useMemo(() => buildMapRoutesGeoJson(shipment), [shipment]);
  const stormGeoJson = stormActive ? STORM_ZONE_GEOJSON : CALM_ZONE_GEOJSON;

  return (
    <div className={styles.wrapper}>
      <MapLegend stormActive={stormActive} />
      <Map initialViewState={{ longitude: 48.2, latitude: 42.5, zoom: 4.6 }} mapStyle={DARK_STYLE} attributionControl={false} style={{ width: '100%', height: '100%' }}>
        <NavigationControl position="top-right" showCompass={false} />
        <Source id="storm-zone" type="geojson" data={stormGeoJson}>
          <Layer id="storm-fill" type="fill" paint={{ 'fill-color': palette.danger, 'fill-opacity': stormActive ? 0.22 : 0.1 }} />
          <Layer id="storm-outline" type="line" paint={{ 'line-color': palette.danger, 'line-width': 1.5, 'line-dasharray': [3, 2] }} />
        </Source>
        <Source id="cargo-routes" type="geojson" data={routeGeoJson}>
          <Layer id="alt-route-line" type="line" filter={['==', ['get', 'selected'], 0]} paint={{ 'line-width': 2, 'line-color': palette.sea, 'line-dasharray': [4, 3], 'line-opacity': 0.75 }} />
          <Layer id="active-route-line" type="line" filter={['==', ['get', 'selected'], 1]} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 3, 'line-color': palette.rail }} />
        </Source>
        <PortMarkers ports={ports} shipment={shipment} stormActive={stormActive} xrayMode={xrayMode} />
      </Map>
      <BioOpticOrbits xrayMode={xrayMode} className={styles.orbits} />
    </div>
  );
}
