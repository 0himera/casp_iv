export const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
export const FRAGMENT = `#version 300 es
// CASPIAN_POSTER: static four-ink color fields, independent of shipment data.
precision highp float;
uniform vec2 u_resolution;
out vec4 fragColor;
const float BAYER[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
float noise(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float wash(vec2 uv, vec2 center, vec2 scale) {
  vec2 p = (uv - center) * scale;
  p.x += .1 * sin(uv.y * 9.);
  return exp(-dot(p, p) * 2.);
}
float ink(float value, float threshold) { return floor(value * 6. + threshold) / 6.; }
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  ivec2 p = ivec2(gl_FragCoord.xy) & 3;
  float threshold = (BAYER[p.y * 4 + p.x] + .5) / 16.;
  vec3 color = vec3(.965, .939, .879);
  color = mix(color, vec3(.40,.76,.81), ink(wash(uv,vec2(.78,.7),vec2(2.5,1.9))*.86,threshold));
  color = mix(color, vec3(.69,.49,.84), ink(wash(uv,vec2(.91,.25),vec2(2.4,2.2))*.8,1.-threshold));
  color = mix(color, vec3(.98,.45,.31), ink(wash(uv,vec2(.64,.47),vec2(4.5,2.9))*.82,threshold));
  color = mix(color, vec3(.98,.83,.43), ink(wash(uv,vec2(.39,.04),vec2(2.5,4.))*.55,1.-threshold));
  color += (noise(gl_FragCoord.xy) - .5) * .045;
  fragColor = vec4(color,1.);
}`;
