// CASPIAN_RISO: decorative ordered dithering, not an additional data layer.
export const VERTEX = `#version 300 es
precision highp float;
in vec2 a_position;
uniform mat4 u_matrix;
out vec2 v_world;
void main() {
  v_world = a_position * 4096.0;
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
}`;

export const FRAGMENT = `#version 300 es
// CASPIAN_RISO
precision highp float;
in vec2 v_world;
uniform float u_time;
uniform float u_pixel_ratio;
uniform vec3 u_ink;
out vec4 fragColor;
const float BAYER[16] = float[16](
  0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0,
  3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0
);
float fiber(vec2 p) {
  vec3 h = fract(vec3(p.xyx) * 0.1031);
  h += dot(h, h.yzx + 33.33);
  return fract((h.x + h.y) * h.z);
}
void main() {
  ivec2 cell = ivec2(floor(gl_FragCoord.xy / (u_pixel_ratio * 1.35))) & 3;
  float threshold = (BAYER[cell.y * 4 + cell.x] + 0.5) / 16.0;
  float wash = 0.35 + 0.06 * sin(v_world.x * 0.7 + v_world.y * 1.1 + u_time * 0.12);
  float grain = fiber(floor(v_world * 160.0));
  float ink = step(threshold, wash + (grain - 0.5) * 0.12);
  float alpha = ink * (0.15 + grain * 0.04);
  fragColor = vec4(u_ink * alpha, alpha);
}`;
