'use client';

import { useState } from 'react';

export function useLayoutState() {
  const [mode, setMode] = useState<'map' | 'graph'>('map');
  const [manifestOpen, setManifestOpen] = useState(false);
  const [customsOpen, setCustomsOpen] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [xrayMode, setXrayMode] = useState(false);

  return {
    mode,
    setMode,
    manifestOpen,
    toggleManifest: () => setManifestOpen((v) => !v),
    closeManifest: () => setManifestOpen(false),
    customsOpen,
    toggleCustoms: () => setCustomsOpen((v) => !v),
    analyticsOpen,
    toggleAnalytics: () => setAnalyticsOpen((v) => !v),
    xrayMode,
    toggleXray: () => setXrayMode((v) => !v),
  };
}
