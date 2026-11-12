'use client';

import { useEffect, useRef } from 'react';
import { getCssVarColor } from '@/shared/lib/theme-colors';

const GLYPHS = ['.', '·', ':', '~', '-', 'o'];

export function AsciiCaspianBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const palette = [
      getCssVarColor('--ascii-slate', '#4D5864'),
      getCssVarColor('--ascii-lavender', '#5C556E'),
      getCssVarColor('--ascii-sage', '#4E625B'),
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
      const t = time * 0.0004;
      for (let y = 18; y < canvas.height; y += 26) {
        for (let x = 14; x < canvas.width; x += 28) {
          const wave = Math.sin(x * 0.01 + t + Math.cos(y * 0.014 - t * 0.5) * 1.3);
          const energy = (wave + Math.cos(y * 0.018 + x * 0.005 - t * 0.7)) * 0.5;
          if (energy < -0.1) continue;
          const idx = Math.min(GLYPHS.length - 1, Math.max(0, Math.floor((energy + 0.15) * 5)));
          ctx.fillStyle = palette[(Math.floor(x / 28) + Math.floor(y / 26)) % palette.length];
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

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-20" />;
}
