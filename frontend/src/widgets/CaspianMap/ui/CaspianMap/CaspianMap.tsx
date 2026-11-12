'use client';

import { useMemo, useRef, useState } from 'react';
import { setWorkerUrl } from 'maplibre-gl';
import Map, { NavigationControl, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { CaspianPort } from '@/entities/cargo';
import { buildMapRoutesGeoJson } from '@/entities/shipment';
import type { Shipment } from '@/shared/api/caspian';
import { BioOpticOrbits } from '@/shared/ui';
import { resolveMapPalette } from '../../model/mapLayers';
import { useMapInteractions } from '../../model/useMapInteractions';
import { MapGeoLayers } from '../MapGeoLayers';
import { MapInspectionOverlays } from '../MapInspectionOverlays';
import { MapLegend } from '../MapLegend';
import { MapPresetsBar } from '../MapPresetsBar';
import { PortMarkers } from '../PortMarkers';
import styles from './CaspianMap.module.css';
import { CorridorExplorer } from '../CorridorExplorer/CorridorExplorer';
import { CorridorLines } from '../CorridorExplorer/CorridorLines';

interface CaspianMapProps {
  ports: CaspianPort[];
  shipment: Shipment;
  stormActive: boolean;
  xrayMode?: boolean;
  onSelectRoute?: (routeId: string) => void;
}

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
if (typeof window !== 'undefined') setWorkerUrl('/maplibre-gl-worker.mjs');

export function CaspianMap({ ports, shipment, stormActive, xrayMode = false, onSelectRoute }: CaspianMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const palette = useMemo(() => resolveMapPalette(), []);
  const routeGeoJson = useMemo(() => buildMapRoutesGeoJson(shipment), [shipment]);
  const i = useMapInteractions(ports, mapRef);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<string[]>([]);

  const onMapClick = (e: MapLayerMouseEvent) => {
    const id = e.features?.[0]?.layer.id;
    if (id === 'storm-fill' || id === 'storm-outline') i.selectStorm();
    if (id === 'alt-route-line') {
      const clickedId = e.features?.[0]?.properties?.id;
      if (clickedId) onSelectRoute?.(clickedId);
    }
  };

  return (
    <div className={styles.wrapper}>
      <MapLegend stormActive={stormActive} />
      <MapPresetsBar activeId={i.activePreset} onSelectPreset={(id) => { setNetworkOpen(false); i.selectPreset(id); }} onReset={i.resetView} onFocusCargo={() => i.selectCargo(shipment.current_location.longitude, shipment.current_location.latitude)} onToggleNetwork={() => { i.closeAll(); setNetworkOpen(!networkOpen); }} />
      <Map ref={mapRef} initialViewState={{ longitude: 48.2, latitude: 42.5, zoom: 4.6 }} mapStyle={DARK_STYLE} attributionControl={false} interactiveLayerIds={['storm-fill', 'alt-route-line']} onClick={onMapClick} style={{ width: '100%', height: '100%' }}>
        <NavigationControl position="bottom-right" showCompass={false} />
        <MapGeoLayers stormActive={stormActive} routeGeoJson={routeGeoJson} palette={palette} />
        <CorridorLines highlighted={highlighted} />
        <PortMarkers ports={ports} shipment={shipment} stormActive={stormActive} xrayMode={xrayMode} selectedPortId={i.selectedPort?.id} cargoSelected={i.cargoSelected} onSelectPort={i.selectPort} onSelectCargo={i.selectCargo} />
      </Map>
      <BioOpticOrbits xrayMode={xrayMode} className={styles.orbits} />
      <MapInspectionOverlays shipment={shipment} selectedPort={i.selectedPort} cargoSelected={i.cargoSelected} stormSelected={i.stormSelected} onSelectRoute={onSelectRoute} onClose={i.closeAll} />
      {networkOpen && <CorridorExplorer onClose={() => setNetworkOpen(false)} onHighlight={setHighlighted} />}
    </div>
  );
}
