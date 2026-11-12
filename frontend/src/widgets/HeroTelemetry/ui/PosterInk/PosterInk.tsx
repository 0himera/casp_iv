'use client';

import { useEffect, useRef } from 'react';
import { FRAGMENT, VERTEX } from './shaders';

export function PosterInk({ className }: { className: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // Composite a static GPU print into 2D so sticky-header repaints cannot clip it.
    const plate = document.createElement('canvas');
    const gl = plate.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false });
    const print = canvas.getContext('2d');
    if (!gl || !print) { canvas.dataset.posterState = 'fallback'; return; }
    let program: WebGLProgram | null = null;
    function draw() {
      if (!gl || !print || !canvas || !program || gl.isContextLost()) return;
      const box = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.max(1, Math.round(box.width * ratio));
      canvas.height = Math.max(1, Math.round(box.height * ratio));
      plate.width = canvas.width; plate.height = canvas.height;
      gl.viewport(0, 0, canvas.width, canvas.height); gl.useProgram(program);
      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      print.drawImage(plate, 0, 0);
    }
    function setup() {
      if (!gl || !canvas) return;
      const shaders: WebGLShader[] = [];
      try {
        for (const [kind, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]] as const) {
          const shader = gl.createShader(kind);
          if (!shader) throw new Error('Poster shader allocation failed');
          shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Poster shader compilation failed');
        }
        program = gl.createProgram();
        if (!program) throw new Error('Poster program allocation failed');
        shaders.forEach((shader) => gl.attachShader(program!, shader)); gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Poster shader link failed');
        draw(); canvas.dataset.posterState = 'ready';
      } catch {
        if (program) gl.deleteProgram(program); program = null;
        canvas.dataset.posterState = 'fallback';
      } finally { shaders.forEach((shader) => gl.deleteShader(shader)); }
    }
    const lost = (event: Event) => { event.preventDefault(); program = null; canvas.dataset.posterState = 'fallback'; };
    plate.addEventListener('webglcontextlost', lost); plate.addEventListener('webglcontextrestored', setup);
    const observer = new ResizeObserver(draw); observer.observe(canvas);
    setup();
    return () => {
      observer.disconnect();
      plate.removeEventListener('webglcontextlost', lost); plate.removeEventListener('webglcontextrestored', setup);
      if (program) gl.deleteProgram(program);
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
