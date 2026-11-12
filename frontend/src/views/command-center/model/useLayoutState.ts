'use client';

import { useState } from 'react';

export type RightDrawerTab = 'customs' | 'analytics' | null;

export function useLayoutState() {
  const [mode, setMode] = useState<'map' | 'graph'>('map');
  const [manifestOpen, setManifestOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<RightDrawerTab>('customs');
  const [xrayMode, setXrayMode] = useState(false);

  const toggleCustoms = () => {
    setActiveDrawer((curr) => (curr === 'customs' ? null : 'customs'));
  };

  const toggleAnalytics = () => {
    setActiveDrawer((curr) => (curr === 'analytics' ? null : 'analytics'));
  };

  return {
    mode,
    setMode,
    manifestOpen,
    toggleManifest: () => setManifestOpen((v) => !v),
    closeManifest: () => setManifestOpen(false),
    customsOpen: activeDrawer === 'customs',
    toggleCustoms,
    closeCustoms: () => setActiveDrawer((curr) => (curr === 'customs' ? null : curr)),
    analyticsOpen: activeDrawer === 'analytics',
    toggleAnalytics,
    closeAnalytics: () => setActiveDrawer((curr) => (curr === 'analytics' ? null : curr)),
    closeRightDrawer: () => setActiveDrawer(null),
    xrayMode,
    toggleXray: () => setXrayMode((v) => !v),
  };
}
