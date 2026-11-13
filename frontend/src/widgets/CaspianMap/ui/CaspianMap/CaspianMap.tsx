'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { ArrowLeft, Focus, Layers, LocateFixed, PanelRightClose } from 'lucide-react';
import Map, { NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { CaspianPort } from '@/entities/cargo';
import { buildMapRoutesGeoJson } from '@/entities/shipment';
import { WorkspacePopover } from '@/shared/ui/workspace-menu/WorkspaceMenu';
import { MapLegend } from './MapLegend';
import { JourneyPlanner } from '@/features/route-selection/ui/JourneyPlanner/JourneyPlanner';
import type { JourneyPreview, Role, Shipment } from '@/shared/api/caspian';
import { applySpectralBasemapTheme, initMapLibreWorker, SPECTRAL_BASE_STYLE } from '../../model/spectralBasemap';
import { useMapInteractions } from '../../model/useMapInteractions';
import { CorridorLines } from '../CorridorExplorer';
import { MapInspectionOverlays } from '../MapInspectionOverlays';
import { DockRoutesList } from '../MapQuickDock/DockRoutesList';
import { RisoWater } from '../RisoWater/RisoWater';
import { MapGeoLayers } from '../MapGeoLayers';
import { PortMarkers } from '../PortMarkers';
import { PortsPanel } from './PortsPanel';
import { WorkspaceNavigation, panelLabels, type WorkspacePanel } from './WorkspaceNavigation';
import styles from './CaspianMap.module.css';

const Graph = dynamic(() => import('@/widgets/MultimodalGraph').then((m) => m.MultimodalGraph), { ssr: false, loading: () => <p>Загрузка графа…</p> });
interface CaspianMapProps {
  ports: CaspianPort[]; shipment: Shipment; stormActive: boolean;
  role?: Role; isBusy?: boolean; onSelectRoute?: (routeId: string) => void;
  onChangeRole?: (role: Role) => void; onChangeJourney?: (origin: string, destination: string) => void; forecast?: ReactNode; documents?: ReactNode;
}
initMapLibreWorker();

export function CaspianMap({ ports, shipment, stormActive, role, isBusy, onSelectRoute, onChangeRole, onChangeJourney, forecast, documents }: CaspianMapProps) {
  const theme = useTheme();
  const mapRef = useRef<MapRef | null>(null);
  const overview = useRef(true);
  const panelRef = useRef<HTMLElement | null>(null);
  const [camera, setCamera] = useState({ longitude: 50.5, latitude: 42, zoom: 4 });
  const previewRef = useRef<JourneyPreview | null>(null);
  const previewFit = useRef(false);
  const [preview, setPreview] = useState<JourneyPreview | null>(null);
  const routeGeoJson = useMemo(() => preview ? {
    type: 'FeatureCollection' as const,
    features: [{ type: 'Feature' as const, properties: { id: preview.route.id, selected: 1, primaryMode: 'sea' }, geometry: { type: 'LineString' as const, coordinates: preview.route.geometry.coordinates } }],
  } : buildMapRoutesGeoJson(shipment), [shipment, preview]);
  const i = useMapInteractions(ports, mapRef);
  const [panel, setPanel] = useState<WorkspacePanel>('routes');
  const [panelOpen, setPanelOpen] = useState(true);
  const [mode, setMode] = useState<'map' | 'graph'>('map');
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [layers, setLayers] = useState({ storm: true, corridors: false, print: true });
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const inspection = Boolean(i.selectedPort || i.cargoSelected || i.stormSelected);
  const viewportPadding = useCallback(() => {
    const padding = { top: 68, bottom: 40, left: 65, right: 65 };
    const map = mapRef.current?.getContainer().getBoundingClientRect();
    const panel = panelRef.current?.getBoundingClientRect();
    if (map && panel) {
      if (panelOpen && window.matchMedia('(max-width: 760px)').matches) padding.bottom = map.bottom - panel.top + 55;
      else padding.right = map.right - panel.left + 65;
    }
    return padding;
  }, [panelOpen]);
  const { longitude, latitude } = shipment.current_location;
  const fitOverview = useCallback(() => mapRef.current?.fitBounds([
    [Math.min(46.5, longitude), Math.min(36.5, latitude)],
    [Math.max(54.5, longitude), Math.max(47.6, latitude)],
  ], { padding: viewportPadding(), absolutePadding: true, duration: 0 }), [longitude, latitude, viewportPadding]);
  const fitPreview = useCallback((value: JourneyPreview, duration = 0) => {
    const coords = [...value.route.geometry.coordinates, [value.origin.longitude, value.origin.latitude], [value.destination.longitude, value.destination.latitude]];
    const padding = viewportPadding();
    mapRef.current?.fitBounds([
      [Math.min(...coords.map((c) => c[0])), Math.min(...coords.map((c) => c[1]))],
      [Math.max(...coords.map((c) => c[0])), Math.max(...coords.map((c) => c[1]))],
    ], { padding: { ...padding, bottom: Math.max(padding.bottom, 80) }, absolutePadding: true, maxZoom: 7, duration });
  }, [viewportPadding]);
  const syncViewport = useCallback(() => {
    if (previewFit.current && previewRef.current) fitPreview(previewRef.current);
    else if (overview.current) fitOverview();
    else mapRef.current?.getMap().setPadding(viewportPadding());
  }, [fitOverview, fitPreview, viewportPadding]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(syncViewport, 80);
    });
    if (panelRef.current) observer.observe(panelRef.current);
    syncViewport();
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [mode, syncViewport]);
  const updateMapTheme = useCallback((map: MapLibreMap) => {
    if (!map.getStyle()?.layers?.length || map.getCanvas().dataset.theme === theme) return;
    map.getCanvas().dataset.theme = theme;
    applySpectralBasemapTheme(map);
  }, [theme]);
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map) updateMapTheme(map);
  }, [updateMapTheme]);
  const showPreview = useCallback((value: JourneyPreview | null) => {
    setPreview(value);
    previewRef.current = value;
    previewFit.current = Boolean(value);
    if (!value) return;
    setMode('map');
    overview.current = false;
    fitPreview(value, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500);
  }, [fitPreview]);
  const collapsePanel = () => {
    setPanelOpen(false);
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLButtonElement>('nav button[aria-pressed="true"]')?.focus({ preventScroll: true }));
  };
  const selectPanel = (next: WorkspacePanel) => { if (next !== panel || panelOpen) i.closeAll(); setPanel(next); setPanelOpen(true); };
  const inspectPort = (port: CaspianPort) => { setCamera({ longitude: port.lng, latitude: port.lat, zoom: 6.5 }); overview.current = false; setPanelOpen(true); setMode('map'); i.selectPort(port); };
  const focusCargo = () => { overview.current = false; setPanelOpen(true); i.selectCargo(shipment.current_location.longitude, shipment.current_location.latitude); };
  const highlight = (ids: string[]) => { setHighlighted(ids); setLayers((l) => ({ ...l, corridors: ids.length > 0 })); setMode('map'); overview.current = true; fitOverview(); };
  return <div className={styles.workspace}>
    <section aria-label="Карта и рабочая панель" className={`${styles.frame} ${panelOpen ? styles.withPanel : styles.withCompactPanel}`}>
      <div className={styles.canvas} data-testid="workspace-map">
        <div className={styles.toolbar}>
          <div className={styles.modeSwitch} aria-label="Представление маршрута">
            <button aria-pressed={mode === 'map'} onClick={() => setMode('map')}>Карта</button><button aria-pressed={mode === 'graph'} onClick={() => setMode('graph')}>Граф</button>
          </div>
          {mode === 'map' && <><button aria-label="Весь Каспий" className={styles.toolButton} onClick={() => { previewFit.current = false; overview.current = true; i.resetView(); fitOverview(); }}><Focus size={16} /><span>Весь Каспий</span></button>
            <button aria-label="К грузу" className={styles.toolButton} onClick={focusCargo}><LocateFixed size={16} /><span>К грузу</span></button>
            <WorkspacePopover label="Слои карты" className={styles.toolButton} trigger={<><Layers size={16} /><span>Слои</span></>}>
              <label><input type="checkbox" checked={layers.corridors} onChange={(e) => setLayers((l) => ({ ...l, corridors: e.target.checked }))} />Опубликованные связи</label>
              <label><input type="checkbox" checked={layers.storm} onChange={(e) => setLayers((l) => ({ ...l, storm: e.target.checked }))} />Зона штормового сценария</label>
              <label><input type="checkbox" checked={layers.print} onChange={(e) => setLayers((l) => ({ ...l, print: e.target.checked }))} />Текстура воды</label>
            </WorkspacePopover></>}
        </div>
        {mode === 'map' ? <Map ref={mapRef} initialViewState={camera} mapStyle={SPECTRAL_BASE_STYLE} attributionControl={false}
          interactiveLayerIds={layers.storm && stormActive ? ['storm-fill'] : []}
          onStyleData={(e) => updateMapTheme(e.target)}
          onLoad={(e) => { updateMapTheme(e.target); syncViewport(); }}
          onMoveEnd={(e) => { setCamera({ longitude: e.viewState.longitude, latitude: e.viewState.latitude, zoom: e.viewState.zoom }); }}
          onResize={syncViewport} onMoveStart={(e) => { if (e.originalEvent) { overview.current = false; previewFit.current = false; } }}
          onClick={(e) => { if (e.features?.[0]?.layer.id === 'storm-fill') { overview.current = false; setPanelOpen(true); i.selectStorm(); } }} style={{ width: '100%', height: '100%' }}>
          <RisoWater enabled={layers.print} /><NavigationControl position="bottom-right" showCompass={false} />
          <MapGeoLayers stormActive={stormActive} routeGeoJson={routeGeoJson} hoveredRouteId={hoveredRouteId} showGrid={false} showStorm={layers.storm} />
          {layers.corridors && <CorridorLines highlighted={highlighted} />}
          <PortMarkers hideCargo={Boolean(preview)} ports={ports} shipment={shipment} stormActive={stormActive} selectedPortId={i.selectedPort?.id} cargoSelected={i.cargoSelected} onSelectPort={inspectPort} onSelectCargo={focusCargo} />
        </Map> : <div className={styles.graph}><Graph shipment={shipment} /></div>}
        <div className={styles.mapCaption}><MapLegend mode={mode} previewLabel={preview ? `${preview.origin.name} → ${preview.destination.name}` : undefined} hasLand={routeGeoJson.features.some((f) => f.properties?.selected === 1 && f.properties?.primaryMode !== 'sea')} hasAlternatives={routeGeoJson.features.some((f) => f.properties?.selected === 0)} /></div>
      </div>
      <aside ref={panelRef} className={`${styles.panel} ${!panelOpen ? styles.collapsed : ''}`} aria-label="Рабочая панель" data-state={panelOpen ? 'expanded' : 'collapsed'}>
        <WorkspaceNavigation panel={panel} open={panelOpen} onSelect={selectPanel} />
        <button type="button" className={styles.collapseControl} aria-label="Свернуть панель" onClick={collapsePanel} hidden={!panelOpen}><PanelRightClose size={19} /></button>
        <div id="workspace-panel-content" className={styles.panelContent} inert={!panelOpen} aria-hidden={!panelOpen}>
        <header className={styles.panelHeader}>{inspection ? <button className={styles.back} onClick={i.closeAll}><ArrowLeft size={16} />{panelLabels[panel]}</button> : <h1>{panelLabels[panel]}</h1>}
        </header>
        <div className={styles.panelBody} key={`${panel}-${inspection ? i.selectedPort?.id ?? (i.cargoSelected ? 'cargo' : 'storm') : 'main'}-${shipment.id}`}>
          {inspection ? <MapInspectionOverlays shipment={shipment} selectedPort={i.selectedPort} cargoSelected={i.cargoSelected} stormSelected={i.stormSelected} isBusy={isBusy} onSelectRoute={onSelectRoute} onClose={i.closeAll} /> : <>
            {panel === 'routes' && <><JourneyPlanner key={`${shipment.id}-${shipment.passport.version}`} shipment={shipment} ports={ports} role={role ?? 'logistician'} isBusy={Boolean(isBusy)} onPreview={showPreview} onSave={onChangeJourney} />{!preview && <DockRoutesList shipment={shipment} role={role} isBusy={isBusy} onSelectRoute={onSelectRoute} onHoverRoute={setHoveredRouteId} onChangeRole={onChangeRole} />}</>}
            {panel === 'forecast' && forecast}{panel === 'documents' && documents}
            {panel === 'ports' && <PortsPanel ports={ports} onSelect={inspectPort} onHighlight={highlight} />}
          </>}
        </div>
        </div>
      </aside>
    </section>
  </div>;
}
