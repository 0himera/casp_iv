'use client';

import { useState, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { CaspianPort } from '@/entities/cargo';

export function useMapInteractions(ports: CaspianPort[], mapRef: RefObject<MapRef | null>) {
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const selectedPort = ports.find((port) => port.id === selectedPortId) ?? null;
  const [cargoSelected, setCargoSelected] = useState(false);
  const [stormSelected, setStormSelected] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('overview');

  const flyTo = (lng: number, lat: number, zoom = 6.2) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 850 });
  };

  const selectPort = (port: CaspianPort) => {
    setSelectedPortId(port.id); setCargoSelected(false); setStormSelected(false);
    setActivePreset(port.id); flyTo(port.lng, port.lat, 6.5);
  };

  const selectCargo = (lng: number, lat: number) => {
    setCargoSelected(true); setSelectedPortId(null); setStormSelected(false);
    setActivePreset('cargo'); flyTo(lng, lat, 6.2);
  };

  const selectStorm = () => {
    setStormSelected(true); setSelectedPortId(null); setCargoSelected(false);
    setActivePreset(null); flyTo(49.46, 37.8, 5.8);
  };

  const selectPreset = (id: string) => {
    const port = ports.find((p) => p.id === id);
    if (port) selectPort(port);
  };

  const resetView = () => {
    setSelectedPortId(null); setCargoSelected(false); setStormSelected(false);
    setActivePreset('overview'); flyTo(48.2, 42.5, 4.6);
  };

  const closeAll = () => {
    setSelectedPortId(null); setCargoSelected(false); setStormSelected(false);
  };

  return { selectedPort, cargoSelected, stormSelected, activePreset, selectPort, selectCargo, selectStorm, selectPreset, resetView, closeAll };
}
