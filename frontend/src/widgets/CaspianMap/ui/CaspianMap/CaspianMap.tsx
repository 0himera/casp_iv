'use client';

import { useMemo, useRef, useState } from 'react';
import Map, { NavigationControl, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { CaspianPort } from '@/entities/cargo';
import { buildMapRoutesGeoJson } from '@/entities/shipment';
import type { Shipment } from '@/shared/api/caspian';
import { resolveMapPalette } from '../../model/mapLayers';
import { applySpectralBasemapTheme, initMapLibreWorker, SPECTRAL_BASE_STYLE } from '../../model/spectralBasemap';
import { useMapInteractions } from '../../model/useMapInteractions';
import { ArchivalMapView } from '../ArchivalMapView';
import { CaspianMapDock } from '../CaspianMapDock';
import { CorridorLines } from '../CorridorExplorer';
import { MapClickMenu, type MapClickPoint } from '../MapClickMenu';
import { MapGeoLayers } from '../MapGeoLayers';
import { MapHudOverlay } from '../MapHudOverlay';
import { MapLegend } from '../MapLegend';
import { MapPresetsBar } from '../MapPresetsBar';
import { PortMarkers } from '../PortMarkers';
import styles from './CaspianMap.module.css';

interface CaspianMapProps { ports: CaspianPort[]; shipment: Shipment; stormActive: boolean; xrayMode?: boolean; onSelectRoute?: (routeId: string) => void; }
initMapLibreWorker();

export function CaspianMap({ ports, shipment, stormActive, xrayMode = false, onSelectRoute }: CaspianMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const palette = useMemo(() => resolveMapPalette(), []);
  const routeGeoJson = useMemo(() => buildMapRoutesGeoJson(shipment), [shipment]);
  const i = useMapInteractions(ports, mapRef);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [archivalMode, setArchivalMode] = useState(false);
  const [dockOpen, setDockOpen] = useState(true);
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const [clickMenu, setClickMenu] = useState<MapClickPoint | null>(null);
  const hasDock = Boolean(dockOpen || networkOpen || i.selectedPort || i.cargoSelected || i.stormSelected);
  const onMapClick = (e: MapLayerMouseEvent) => {
    const id = e.features?.[0]?.layer.id;
    if (id === 'storm-fill' || id === 'storm-outline') { setClickMenu(null); i.selectStorm(); return; }
    const rect = e.target.getContainer().getBoundingClientRect();
    setClickMenu({ x: e.point.x, y: e.point.y, lng: e.lngLat.lng, lat: e.lngLat.lat, width: rect.width, height: rect.height });
  };
  return (
    <section id="map-section" className={styles.frame}><div className={styles.halo} /><div className={styles.toolbar}>
      <span className={styles.overline}>[ FIG. 01: КАСПИЙСКАЯ ГИДРОЛОГИЯ И ВЕКТОРЫ КОРИДОРОВ ]</span>
      <MapPresetsBar activeId={archivalMode ? 'archival' : i.activePreset} dockOpen={hasDock} onSelectPreset={(id) => { setArchivalMode(false); setNetworkOpen(false); setClickMenu(null); i.selectPreset(id); }} onReset={() => { setArchivalMode(false); setClickMenu(null); i.resetView(); }} onFocusCargo={() => { setArchivalMode(false); setClickMenu(null); i.selectCargo(shipment.current_location.longitude, shipment.current_location.latitude); }} onToggleNetwork={() => { i.closeAll(); setClickMenu(null); setNetworkOpen((v) => !v); }} onToggleArchival={() => { setClickMenu(null); setArchivalMode((v) => !v); }} onToggleDock={() => { i.closeAll(); setNetworkOpen(false); setDockOpen((v) => !v); }} />
    </div><div className={`${styles.stageGrid} ${hasDock ? styles.stageWithDock : ''}`}><div className={styles.canvas}>{archivalMode ? <ArchivalMapView /> : (
      <><Map ref={mapRef} initialViewState={{ longitude: 49.4, latitude: 41.8, zoom: 4.6 }} mapStyle={SPECTRAL_BASE_STYLE} attributionControl={false} interactiveLayerIds={['storm-fill', 'alt-route-line']} onLoad={(e) => applySpectralBasemapTheme(e.target)} onClick={onMapClick} style={{ width: '100%', height: '100%' }}>
        <NavigationControl position="bottom-right" showCompass={false} /><MapGeoLayers stormActive={stormActive} routeGeoJson={routeGeoJson} palette={palette} /><CorridorLines highlighted={highlighted} />
        <PortMarkers ports={ports} shipment={shipment} stormActive={stormActive} xrayMode={xrayMode} selectedPortId={i.selectedPort?.id} cargoSelected={i.cargoSelected} onSelectPort={(p) => { setNetworkOpen(false); setClickMenu(null); i.selectPort(p); }} onSelectCargo={(lng, lat) => { setNetworkOpen(false); setClickMenu(null); i.selectCargo(lng, lat); }} />
      </Map><MapHudOverlay stormActive={stormActive} />{clickMenu && <MapClickMenu point={clickMenu} ports={ports} shipment={shipment} onInspectPort={(p) => { setNetworkOpen(false); i.selectPort(p); }} onSelectRoute={onSelectRoute} onFocusCargo={() => i.selectCargo(shipment.current_location.longitude, shipment.current_location.latitude)} onResetView={i.resetView} onClose={() => setClickMenu(null)} />}</>
    )}</div>{hasDock && <aside className={styles.dock}><CaspianMapDock networkOpen={networkOpen} dockOpen={dockOpen} ports={ports} shipment={shipment} selectedPort={i.selectedPort} cargoSelected={i.cargoSelected} stormSelected={i.stormSelected} onCloseNetwork={() => setNetworkOpen(false)} onHighlight={setHighlighted} onSelectRoute={onSelectRoute} onSelectPort={(p) => { setNetworkOpen(false); i.selectPort(p); }} onCloseInspection={i.closeAll} onCollapseDock={() => { i.closeAll(); setNetworkOpen(false); setDockOpen(false); }} /></aside>}</div><MapLegend stormActive={stormActive} /></section>
  );
}
