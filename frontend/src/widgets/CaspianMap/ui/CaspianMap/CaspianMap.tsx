'use client';

import { useMemo } from 'react';
import { setWorkerUrl } from 'maplibre-gl';
import Map, { Layer, NavigationControl, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CALM_ZONE_GEOJSON, STORM_ZONE_GEOJSON } from '@/data/mockTransitData';
import type { CargoItem, CaspianPort } from '@/entities/cargo';
import { buildRouteGeoJson, resolveMapPalette } from '../../model/mapLayers';
import { MapLegend } from '../MapLegend';
import { PortMarkers } from '../PortMarkers';
import styles from './CaspianMap.module.css';

interface CaspianMapProps {
  ports: CaspianPort[];
  selectedCargo: CargoItem;
  stormActive: boolean;
}

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
if (typeof window !== 'undefined') setWorkerUrl('/maplibre-gl-worker.mjs');

export function CaspianMap({ ports, selectedCargo, stormActive }: CaspianMapProps) {
  const palette = useMemo(() => resolveMapPalette(), []);
  const routeGeoJson = useMemo(() => buildRouteGeoJson(selectedCargo.segments), [selectedCargo.segments]);
  const stormGeoJson = stormActive ? STORM_ZONE_GEOJSON : CALM_ZONE_GEOJSON;
  return (
    <div className={styles.wrapper}>
      <MapLegend stormActive={stormActive} />
      <Map initialViewState={{ longitude: 49.8, latitude: 40.8, zoom: 4.5 }} mapStyle={DARK_STYLE} attributionControl={false} style={{ width: '100%', height: '100%' }}>
        <NavigationControl position="top-right" showCompass={false} />
        <Source id="storm-zone" type="geojson" data={stormGeoJson}>
          <Layer id="storm-fill" type="fill" paint={{ 'fill-color': palette.danger, 'fill-opacity': stormActive ? 0.28 : 0.14 }} />
          <Layer id="storm-outline" type="line" paint={{ 'line-color': palette.danger, 'line-width': 1.5, 'line-dasharray': [3, 2] }} />
        </Source>
        <Source id="cargo-route" type="geojson" data={routeGeoJson}>
          <Layer
            id="cargo-route-line"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-width': 3.5,
              'line-color': ['match', ['get', 'mode'], 'rail', palette.rail, 'sea', palette.sea, 'road', palette.road, palette.rail],
            }}
          />
        </Source>
        <PortMarkers ports={ports} selectedCargo={selectedCargo} stormActive={stormActive} />
      </Map>
    </div>
  );
}
