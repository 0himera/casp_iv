'use client';

import { useEffect, useRef } from 'react';
import { getCssVarColor } from '@/shared/lib/theme-colors';

const GLYPHS = ['.', ':', ';', 'o', 't', 'S', 'X', '%'];

export function AsciiCaspianBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const palette = [
      getCssVarColor('--ascii-slate', '#6E7D8C'),
      getCssVarColor('--ascii-lavender', '#897CA6'),
      getCssVarColor('--ascii-sage', '#67857B'),
    ];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '11px monospace';
      const t = time * 0.00055;
      for (let y = 16; y < canvas.height; y += 22) {
        for (let x = 12; x < canvas.width; x += 24) {
          const wave = Math.sin(x * 0.011 + t + Math.cos(y * 0.015 - t * 0.6) * 1.4);
          const energy = (wave + Math.cos(y * 0.02 + x * 0.006 - t * 0.8)) * 0.5;
          if (energy < -0.18) continue;
          const idx = Math.min(GLYPHS.length - 1, Math.max(0, Math.floor((energy + 0.2) * 6.5)));
          ctx.fillStyle = palette[(Math.floor(x / 24) + Math.floor(y / 22)) % palette.length];
          ctx.fillText(GLYPHS[idx], x, y);
        }
      }
      if (!reduced) rafId = window.requestAnimationFrame(draw);
    };

    rafId = window.requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-30" />;
}
