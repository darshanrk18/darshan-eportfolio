/**
 * Glyph-field shaders (spec §5.5). The 3D simplex noise is inlined (Ashima
 * webgl-noise, MIT — the ~600B "no dependency" noise the spec calls for) and
 * drives a divergence-free 2D curl flow. Cursor repulsion within 80px,
 * scroll-velocity turbulence (jitter + 5% brightness), ±12px parallax and the
 * two depth layers are all resolved per-vertex; the fragment shader just
 * samples the atlas and tints with the two accent colors.
 */

const SIMPLEX_NOISE_3D = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

export const glyphVertexShader = /* glsl */ `
uniform float uTime;
uniform vec2 uSize;
uniform vec2 uCursor;
uniform float uCursorActive;
uniform float uTurb;
uniform vec2 uParallax;

attribute vec2 aCell;   // base position in [-0.5, 0.5]^2 (scaled by uSize)
attribute vec4 aRand;   // x: size pick, y: phase, z: glyph index, w: alpha/color pick
attribute float aDepth; // 0 = far layer, 1 = near layer

varying vec2 vUv;
varying float vAlpha;
varying float vPick;

${SIMPLEX_NOISE_3D}

// Divergence-free 2D flow: curl of a scalar noise field (finite differences).
vec2 curl(vec2 p, float t) {
  float e = 0.35;
  float n1 = snoise(vec3(p.x, p.y + e, t));
  float n2 = snoise(vec3(p.x, p.y - e, t));
  float n3 = snoise(vec3(p.x + e, p.y, t));
  float n4 = snoise(vec3(p.x - e, p.y, t));
  return vec2(n1 - n2, -(n3 - n4)) / (2.0 * e);
}

void main() {
  vec2 base = aCell * uSize;
  float t = uTime * 0.05 + aRand.y * 13.0;

  // Curl-noise drift (far layer drifts less).
  vec2 flow = curl(aCell * 3.0 + aRand.y, t);
  vec2 pos = base + flow * mix(16.0, 32.0, aDepth);

  // Scroll-velocity turbulence: jitter that "unsolves" the field.
  pos += vec2(
    snoise(vec3(aRand.y * 7.1, uTime * 2.3, 3.7)),
    snoise(vec3(uTime * 2.3, aRand.y * 5.3, 9.1))
  ) * uTurb * 14.0;

  // Cursor repulsion within 80px.
  vec2 d = pos - uCursor;
  float dist = max(length(d), 0.001);
  float rep = smoothstep(80.0, 0.0, dist) * uCursorActive;
  pos += (d / dist) * rep * 36.0;

  // Whole-field parallax (±12px), stronger on the near layer.
  pos += uParallax * mix(0.5, 1.0, aDepth);

  float size = mix(9.0, 20.0, aRand.x) * mix(0.6, 1.0, aDepth);
  vec4 world = vec4(pos + position.xy * size, mix(-1.0, 0.0, aDepth), 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * world;

  // Atlas cell UV (4×4 grid; texture flipY ⇒ invert the row).
  float idx = aRand.z;
  vec2 cell = vec2(mod(idx, 4.0), 3.0 - floor(idx / 4.0));
  vUv = (uv + cell) / 4.0;

  // 8–20% opacity, far layer dimmer (§5.5).
  vAlpha = mix(0.08, 0.20, fract(aRand.w * 7.31)) * mix(0.55, 1.0, aDepth);
  vPick = step(0.5, aRand.w);
}
`

/**
 * No explicit `precision` here: THREE.ShaderMaterial injects the renderer's
 * float precision (highp) into BOTH stages. A hand-written `precision mediump
 * float;` would make fragment `uTurb` mediump while the vertex stage stays
 * highp — a link-time "precisions of uniform differ" error on strict drivers
 * (macOS ANGLE), which kills the whole program.
 */
export const glyphFragmentShader = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec3 uColorA; // --accent-signal
uniform vec3 uColorB; // --accent-electron
uniform float uTurb;

varying vec2 vUv;
varying float vAlpha;
varying float vPick;

void main() {
  float a = texture2D(uAtlas, vUv).a;
  if (a < 0.01) discard;
  vec3 color = mix(uColorA, uColorB, vPick) * (1.0 + 0.05 * uTurb);
  gl_FragColor = vec4(color, a * vAlpha);
}
`
