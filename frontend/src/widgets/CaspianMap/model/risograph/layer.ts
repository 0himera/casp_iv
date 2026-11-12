import type { CustomLayerInterface, CustomRenderMethodInput, Map } from 'maplibre-gl';
import { getCssVarColor } from '@/shared/lib/theme-colors';
import { VERTEX, FRAGMENT } from './shaders';

function shader(gl: WebGL2RenderingContext, type: number, source: string) {
  const result = gl.createShader(type);
  if (!result) throw new Error('Riso shader allocation failed');
  gl.shaderSource(result, source); gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(result);
    gl.deleteShader(result); throw new Error(message ?? 'Riso shader compilation failed');
  }
  return result;
}

export class RisoLayer implements CustomLayerInterface {
  id = 'caspian-risograph';
  type = 'custom' as const;
  renderingMode = '2d' as const;
  time = 0;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private ink = [0.6, 0.74, 0.68];
  private map: Map | null = null;
  constructor(private readonly mesh: Float32Array) {}

  onAdd(map: Map, gl: WebGL2RenderingContext) {
    this.map = map;
    const shaders: WebGLShader[] = [];
    try {
      shaders.push(shader(gl, gl.VERTEX_SHADER, VERTEX));
      shaders.push(shader(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      this.program = gl.createProgram();
      if (!this.program) throw new Error('Riso program allocation failed');
      for (const item of shaders) gl.attachShader(this.program, item);
      gl.linkProgram(this.program);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error('Riso shader link failed');
      this.buffer = gl.createBuffer(); this.vao = gl.createVertexArray();
      if (!this.buffer || !this.vao) throw new Error('Riso geometry allocation failed');
      gl.bindVertexArray(this.vao); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.mesh, gl.STATIC_DRAW);
      const position = gl.getAttribLocation(this.program, 'a_position');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      for (const name of ['u_matrix', 'u_time', 'u_pixel_ratio', 'u_ink']) {
        this.uniforms[name] = gl.getUniformLocation(this.program, name);
      }
      const color = getCssVarColor('--riso-water-ink', 'rgba(153,189,173,1)');
      this.ink = (color.match(/[\d.]+/g) ?? ['153', '189', '173']).slice(0, 3).map((n) => Number(n) / 255);
      map.getCanvas().dataset.risoState = 'ready';
    } catch (error) {
      this.onRemove(map, gl); throw error;
    } finally {
      for (const item of shaders) gl.deleteShader(item);
    }
  }

  render(gl: WebGL2RenderingContext, options: CustomRenderMethodInput) {
    if (!this.program || !this.vao || !this.map) return;
    gl.useProgram(this.program); gl.bindVertexArray(this.vao);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniformMatrix4fv(this.uniforms.u_matrix, false, new Float32Array(options.defaultProjectionData.mainMatrix));
    gl.uniform1f(this.uniforms.u_time, this.time);
    gl.uniform1f(this.uniforms.u_pixel_ratio, gl.drawingBufferWidth / Math.max(1, this.map.getCanvas().clientWidth));
    gl.uniform3fv(this.uniforms.u_ink, this.ink);
    gl.drawArrays(gl.TRIANGLES, 0, this.mesh.length / 2);
    gl.bindVertexArray(null);
  }

  contextLost() { this.vao = null; this.buffer = null; this.program = null; }

  onRemove(_map: Map, gl: WebGL2RenderingContext) {
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.buffer) gl.deleteBuffer(this.buffer);
    if (this.program) gl.deleteProgram(this.program);
    this.vao = null; this.buffer = null; this.program = null;
  }
}
