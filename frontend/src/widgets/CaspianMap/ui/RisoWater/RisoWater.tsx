'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { GeoJSONSource } from 'maplibre-gl';
import { waterMesh } from '../../model/risograph/geometry';
import { RisoLayer } from '../../model/risograph/layer';

export function RisoWater({ enabled }: { enabled: boolean }) {
  const { current } = useMap();
  useEffect(() => {
    if (!current || !enabled) return;
    const map = current.getMap(), canvas = map.getCanvas();
    let disposed = false, loading = false, failed = false, visible = false, contextLost = false;
    const startedAt = performance.now();
    let layer: RisoLayer | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = window.matchMedia('(pointer: coarse)');
    function schedule() {
      clearInterval(timer); timer = undefined;
      const animate = visible && !document.hidden && !motion.matches && !coarse.matches && !contextLost;
      canvas.dataset.risoMotion = animate ? 'animated' : 'static';
      if (animate) timer = setInterval(() => {
        if (layer) { layer.time = (performance.now() - startedAt) / 1000; map.triggerRepaint(); }
      }, 100); // Ten frames/sec; camera movement is still rendered by MapLibre.
    }
    async function install() {
      if (disposed || loading || failed || map.getLayer('caspian-risograph') || !map.getLayer('bathymetry-isobath')) return;
      const source = map.getSource('caspian-water') as GeoJSONSource | undefined;
      if (!source || !map.isSourceLoaded('caspian-water')) return;
      loading = true;
      try {
        const data = await source.getData(); // Reuse the map's loaded water mask; no new fetch.
        if (disposed) return;
        const mesh = waterMesh(data);
        if (!mesh.length) throw new Error('Empty water mask');
        layer = new RisoLayer(mesh);
        map.addLayer(layer, 'bathymetry-isobath');
        schedule(); map.triggerRepaint();
      } catch {
        failed = true;
        if (map.getLayer('caspian-risograph')) map.removeLayer('caspian-risograph');
        layer = null; canvas.dataset.risoState = 'fallback';
      } finally { loading = false; }
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio > 0.1; schedule();
    }, { threshold: [0, 0.1] });
    observer.observe(canvas);
    const lost = () => {
      contextLost = true; clearInterval(timer); layer?.contextLost();
      canvas.dataset.risoState = 'lost'; canvas.dataset.risoMotion = 'static';
    };
    const restored = () => {
      contextLost = false; failed = false;
      if (map.getLayer('caspian-risograph')) map.removeLayer('caspian-risograph');
      void install();
    };
    map.on('sourcedata', install); map.on('styledata', install);
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    coarse.addEventListener('change', schedule);
    motion.addEventListener('change', schedule); document.addEventListener('visibilitychange', schedule);
    void install();
    return () => {
      disposed = true; clearInterval(timer); observer.disconnect();
      map.off('sourcedata', install); map.off('styledata', install);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      coarse.removeEventListener('change', schedule);
      motion.removeEventListener('change', schedule); document.removeEventListener('visibilitychange', schedule);
      if (map.getLayer('caspian-risograph')) map.removeLayer('caspian-risograph');
      delete canvas.dataset.risoState; delete canvas.dataset.risoMotion;
    };
  }, [current, enabled]);
  return null;
}
