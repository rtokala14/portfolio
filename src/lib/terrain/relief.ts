/**
 * The relief model: a WebGL2 renderer for the Jebel Jais heightfield, drawn in the manner
 * of Swiss national maps.
 *
 * - A grid mesh is displaced by the elevation texture in the vertex shader.
 * - Cartography happens per fragment: Imhof-style hypsometric tints adapted to bare limestone,
 *   oblique relief shading with warm lights and blue-violet shadows, contours whose interval
 *   generalises with scale, wadis in blue, and a kilometre grid on the flat sheet.
 * - The block has cut sides showing strata and stands on a soft shadow.
 * - The camera is a set of critically damped springs. It renders on demand and sleeps when still.
 */
import { EXAGGERATION, HALF_D, HALF_W, KM_PER_UNIT, type Terrain } from "./field";

export interface View {
  tx: number;
  tz: number;
  dist: number;
  yaw: number; // radians, 0 = standing south, looking north
  pitch: number; // radians above the horizon
  fov: number; // radians
  map: number; // 0 = relief model, 1 = flat map sheet
}

type Vec3 = [number, number, number];

/* ---------- matrices (column-major) ---------- */
function perspective(fov: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fov / 2),
    nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}
function lookAt(e: Vec3, c: Vec3, up: Vec3): Float32Array {
  let zx = e[0] - c[0],
    zy = e[1] - c[1],
    zz = e[2] - c[2];
  let l = Math.hypot(zx, zy, zz);
  zx /= l;
  zy /= l;
  zz /= l;
  let xx = up[1] * zz - up[2] * zy,
    xy = up[2] * zx - up[0] * zz,
    xz = up[0] * zy - up[1] * zx;
  l = Math.hypot(xx, xy, xz) || 1;
  xx /= l;
  xy /= l;
  xz /= l;
  const yx = zy * xz - zz * xy,
    yy = zz * xx - zx * xz,
    yz = zx * xy - zy * xx;
  return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
}
function mul(a: Float32Array, b: Float32Array): Float32Array {
  const o = new Float32Array(16);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + j]! * b[i * 4 + k]!;
      o[i * 4 + j] = s;
    }
  return o;
}

const YK = (EXAGGERATION / (KM_PER_UNIT * 1000)).toFixed(8); // metres → world y
const HALF = `vec2(${HALF_W.toFixed(4)}, ${HALF_D.toFixed(4)})`;

/* ---------- shaders ---------- */
const VERT = /* glsl */ `#version 300 es
precision highp float;
in vec2 aGrid; in float aSkirt; in vec2 aSide;
uniform mat4 uVP; uniform sampler2D uHeight; uniform float uBase; uniform int uMode;
out vec3 vPos; out vec2 vUv; out float vM; out float vSkirt; out vec3 vSideN;
void main(){
  vec2 half_ = ${HALF};
  if(uMode == 1){ // ground shadow
    vec2 p = (aGrid*2.0-1.0)*half_*1.9;
    vPos = vec3(p.x, -uBase-0.002, p.y); vUv = aGrid; vM = 0.0; vSkirt = 2.0; vSideN = vec3(0,1,0);
    gl_Position = uVP*vec4(vPos,1.0); return;
  }
  vec2 p = (aGrid*2.0-1.0)*half_;
  // the land settles toward the sheet's border, so there is never a cliff at the edge
  vec2 e2 = min(aGrid, 1.0-aGrid);
  float edge = smoothstep(0.0, 0.09, min(e2.x, e2.y*1.6));
  float m = texture(uHeight, aGrid).r*1000.0 * edge;
  float y = m*${YK};
  vUv = aGrid; vM = m; vSideN = vec3(aSide.x, 0.0, aSide.y);
  if(aSkirt > 0.5){ vPos = vec3(p.x, -uBase, p.y); vSkirt = 1.0; }
  else { vPos = vec3(p.x, y, p.y); vSkirt = dot(aSide,aSide) > 0.0 ? 1.0 : 0.0; }
  gl_Position = uVP*vec4(vPos,1.0);
}`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec3 vPos; in vec2 vUv; in float vM; in float vSkirt; in vec3 vSideN;
uniform sampler2D uHeight; uniform sampler2D uWadi; uniform vec2 uTexel;
uniform vec3 uSun; uniform float uMap; uniform float uDark; uniform float uCI; uniform float uBase;
uniform vec3 uFocus; // x, z, strength
uniform float uPx;   // world units per screen pixel at the target, for generalisation
uniform vec3 uEye; uniform vec2 uFog; uniform float uTime; uniform float uLife;
out vec4 o;

#define hex(r,g,b) (vec3(float(r),float(g),float(b))/255.0)
vec3 pick(vec3 day, vec3 dusk){ return mix(day, dusk, uDark); }
float lineAA(float v, float w){ float d = abs(fract(v+0.5)-0.5); float aa = max(fwidth(v), 1e-5); return 1.0 - smoothstep(aa*(w-0.5), aa*(w+0.5), d); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }

vec3 hyps(float m){
  // bare limestone country: gravel plain → fan → ochre slopes → grey rock → pale crest
  vec3 c0 = pick(hex(236,230,212), hex(44,46,44));
  vec3 c1 = pick(hex(234,226,204), hex(56,54,48));
  vec3 c2 = pick(hex(232,220,196), hex(70,64,54));
  vec3 c3 = pick(hex(226,214,196), hex(84,76,66));
  vec3 c4 = pick(hex(214,208,200), hex(98,96,96));
  vec3 c5 = pick(hex(240,238,234), hex(140,140,146));
  vec3 c = c0;
  c = mix(c, c1, smoothstep(60.0, 300.0, m));
  c = mix(c, c2, smoothstep(300.0, 800.0, m));
  c = mix(c, c3, smoothstep(800.0, 1300.0, m));
  c = mix(c, c4, smoothstep(1300.0, 1750.0, m));
  c = mix(c, c5, smoothstep(1850.0, 2050.0, m));
  return c;
}

vec3 hazeCol(){ return pick(hex(232,228,218), hex(22,27,34)); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }

void main(){
  vec3 L = normalize(uSun);
  if(vSkirt > 0.5) discard; // no block sides, no table: the land fades into haze instead
  if(vSkirt > 1.5){
    float d = length(vPos.xz / (${HALF}*vec2(1.06,1.12)));
    float a = (1.0 - smoothstep(0.55, 1.05, d)) * 0.3 * (1.0-uMap);
    o = vec4(pick(vec3(0.17,0.16,0.22), vec3(0.0))*a, a); return;
  }
  if(vSkirt > 0.5){ // the cut face of the block: bedded limestone
    float t = clamp((vPos.y + uBase) / (uBase + vM*${YK} + 1e-4), 0.0, 1.0);
    vec3 a = pick(hex(232,220,196), hex(66,60,52));
    vec3 b = pick(hex(220,204,176), hex(56,50,44));
    float beds = vPos.y*22.0 + sin(vPos.x*5.0+vPos.z*4.0)*0.25;
    vec3 c = mix(a, b, smoothstep(0.35, 0.65, fract(beds))*0.5);
    c *= 0.86 + 0.14*t;
    c *= 0.72 + 0.28*max(dot(normalize(vSideN), normalize(vec3(L.x, 0.3, L.z))), 0.0);
    c = mix(c, c*0.88, lineAA(beds, 0.5));
    o = vec4(c, 1.0); return;
  }

  // per-fragment normal from the elevation texture (metres → world units)
  float hl = texture(uHeight, vUv - vec2(uTexel.x,0)).r, hr = texture(uHeight, vUv + vec2(uTexel.x,0)).r;
  float hd = texture(uHeight, vUv - vec2(0,uTexel.y)).r, hu = texture(uHeight, vUv + vec2(0,uTexel.y)).r;
  float k = 1000.0*${YK};
  vec2 cell = 2.0*${HALF}*uTexel*2.0;
  vec3 N = normalize(vec3(-(hr-hl)*k/cell.x, 1.0, -(hu-hd)*k/cell.y));
  float m = vM;

  float diff = dot(N, L);
  float shade = clamp(diff*0.95 + 0.28, 0.0, 1.3);

  vec3 base = hyps(m);
  // scree and gravel fans: a little texture on the plain and in the wadi floors
  base *= 0.985 + 0.03*hash(floor(vPos.xz*900.0));

  // Imhof: warm light, cool blue-violet shade, haze over the low ground
  vec3 lightTint = pick(vec3(1.07,1.03,0.95), vec3(1.02,0.97,0.9));
  vec3 shadowTint = pick(vec3(0.60,0.62,0.80), vec3(0.40,0.44,0.62));
  vec3 col = base * mix(shadowTint, lightTint, clamp(shade,0.0,1.0));
  col += max(shade-1.0,0.0)*0.12;
  float haze = (1.0 - smoothstep(0.0, 1400.0, m))*0.14;
  col = mix(col, pick(hex(232,236,238), hex(26,32,40)), haze);

  // wadis: blue, only the larger ones at small scale
  float w = texture(uWadi, vUv).r;
  float wmin = mix(0.5, 0.78, clamp(uPx*700.0, 0.0, 1.0));
  float wadi = smoothstep(wmin, wmin+0.12, w);
  col = mix(col, pick(hex(72,136,186), hex(110,170,220)), wadi*0.7);

  // contours: brown, interval generalised by scale, index every fifth line, fading when crowded
  float c1 = m/uCI, c5 = m/(uCI*5.0);
  float dens = fwidth(c1);
  float minor = lineAA(c1, 0.6) * (1.0 - smoothstep(0.25, 0.6, dens));
  float index = lineAA(c5, 1.1) * (1.0 - smoothstep(0.35, 0.8, fwidth(c5)));
  float cA = max(minor*0.13, index*0.46) * step(20.0, m);
  col = mix(col, pick(hex(166,108,62), hex(196,150,108)), cA*(1.0-0.3*uDark));

  // focus: lift the visited summit and let the rest of the sheet recede
  if(uFocus.z > 0.001){
    float fd = length(vPos.xz - uFocus.xy);
    float kf = 1.0 - smoothstep(0.12, 0.55, fd);
    vec3 recede = mix(col, pick(hex(246,246,242), hex(18,22,28)), 0.38);
    col = mix(col, mix(recede, col, kf), uFocus.z);
  }

  // kilometre grid on the flat sheet
  float g = max(lineAA(vPos.x*${KM_PER_UNIT.toFixed(2)}, 0.5), lineAA(vPos.z*${KM_PER_UNIT.toFixed(2)}, 0.5));
  col = mix(col, pick(hex(60,70,82), hex(190,200,214)), g*uMap*0.16);

  // cloud shadows drifting over the range
  if(uLife > 0.001){
    vec2 cp = vPos.xz*1.35 + vec2(uTime*0.012, uTime*0.004);
    float cl = vn(cp)*0.6 + vn(cp*2.3+3.1)*0.4;
    float sh = smoothstep(0.56, 0.74, cl);
    col *= 1.0 - sh*0.13*uLife*(1.0-0.5*uDark);
  }

  // atmosphere: distance and the sheet's border both fade into the same haze as the sky behind
  float dist = length(vPos - uEye);
  float fog = smoothstep(uFog.x, uFog.y, dist);
  vec2 e2 = min(vUv, 1.0-vUv);
  float border = 1.0 - smoothstep(0.0, 0.11, min(e2.x, e2.y*1.6));
  col = mix(col, hazeCol(), clamp(max(fog*0.9, border), 0.0, 1.0));

  col += (hash(gl_FragCoord.xy)-0.5)*0.008; // dither against banding
  o = vec4(col, 1.0);
}`;

/* ---------- springs ---------- */
interface Spring {
  x: number;
  v: number;
  target: number;
}
function stepSpring(s: Spring, dt: number, omega: number) {
  const x = s.x - s.target;
  const e = Math.exp(-omega * dt);
  const nx = (x + (s.v + omega * x) * dt) * e;
  s.v = (s.v - omega * (s.v + omega * x) * dt) * e;
  s.x = nx + s.target;
}
const settled = (s: Spring) => Math.abs(s.x - s.target) < 1e-4 && Math.abs(s.v) < 1e-4;

export interface ReliefOptions {
  canvas: HTMLCanvasElement;
  terrain: Terrain;
  view: View;
  dark: boolean;
  reducedMotion: boolean;
  onFrame?: (r: Relief) => void;
}

const KEYS = ["tx", "tz", "dist", "yaw", "pitch", "fov", "map"] as const;
type Key = (typeof KEYS)[number];

export class Relief {
  readonly canvas: HTMLCanvasElement;
  readonly terrain: Terrain;
  private gl: WebGL2RenderingContext;
  private prog!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private quad!: WebGLVertexArrayObject;
  private count = 0;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private springs: Record<Key, Spring>;
  private dragYaw: Spring = { x: 0, v: 0, target: 0 };
  private dragPitch: Spring = { x: 0, v: 0, target: 0 };
  private dragging = false;
  private focusS: Spring = { x: 0, v: 0, target: 0 };
  private raf = 0;
  private last = 0;
  private dirty = true;
  private vp: Float32Array = new Float32Array(16);
  private eye: Vec3 = [0, 3, 0];
  private camDist = 3;
  /** Idle life: slow sway and drifting cloud shadows. Off with reduced motion. */
  alive = true;
  private t0 = performance.now();
  private lastRender = 0;
  private w = 1;
  private h = 1;
  sun: Vec3 = [-0.5, 0.7, -0.5];
  dark: boolean;
  focus: [number, number] = [0, 0];
  reducedMotion: boolean;
  onFrame?: (r: Relief) => void;
  visible = true;
  /** Fraction of the canvas width covered by text on the left; the camera frames the rest. Animated. */
  private shiftS: Spring = { x: 0, v: 0, target: 0 };
  set leftFrac(f: number) {
    this.shiftS.target = f;
    if (this.reducedMotion) this.shiftS.x = f;
    this.wake();
  }
  get leftFrac() {
    return this.shiftS.x;
  }
  /** Elevation exaggeration multiplier, for the hidden "flatten" toy. */
  private yScale: Spring = { x: 1, v: 0, target: 1 };

  constructor(o: ReliefOptions) {
    this.canvas = o.canvas;
    this.terrain = o.terrain;
    this.dark = o.dark;
    this.reducedMotion = o.reducedMotion;
    if (o.onFrame) this.onFrame = o.onFrame;
    const gl = o.canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: true, alpha: true, powerPreference: "high-performance" });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    this.springs = Object.fromEntries(KEYS.map((k) => [k, { x: o.view[k], v: 0, target: o.view[k] }])) as Record<Key, Spring>;
    this.build();
    this.resize();
  }

  private compile(type: number, src: string) {
    const gl = this.gl;
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  }

  private build() {
    const gl = this.gl;
    const p = gl.createProgram()!;
    gl.attachShader(p, this.compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, this.compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
    this.prog = p;
    for (const n of ["uVP", "uHeight", "uWadi", "uTexel", "uBase", "uMode", "uSun", "uMap", "uDark", "uCI", "uFocus", "uPx", "uEye", "uFog", "uTime", "uLife"]) this.u[n] = gl.getUniformLocation(p, n);

    const { width: TW, height: TH } = this.terrain.meta;
    // textures: elevation (km, half float) and wadi strength
    const km = new Float32Array(this.terrain.metres.length);
    for (let i = 0; i < km.length; i++) km[i] = this.terrain.metres[i]! / 1000;
    const tex = (unit: number, internal: number, format: number, type: number, data: ArrayBufferView) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, TW, TH, 0, format, type, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    tex(0, gl.R16F, gl.RED, gl.FLOAT, km);
    tex(1, gl.R8, gl.RED, gl.UNSIGNED_BYTE, this.terrain.wadi);

    // mesh: phones get a lighter grid
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    const NX = small ? 320 : TW - 1,
      NZ = Math.round(NX * (HALF_D / HALF_W));
    const verts: number[] = [];
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) verts.push(i / NX, j / NZ, 0, 0, 0);
    const idx: number[] = [];
    const at = (i: number, j: number) => j * (NX + 1) + i;
    for (let j = 0; j < NZ; j++)
      for (let i = 0; i < NX; i++) {
        const a = at(i, j),
          b = at(i + 1, j),
          c = at(i, j + 1),
          d = at(i + 1, j + 1);
        idx.push(a, c, b, b, c, d);
      }
    const edge = (pts: [number, number][], nx: number, nz: number) => {
      const start = verts.length / 5;
      for (const [gx, gz] of pts) verts.push(gx, gz, 0, nx, nz, gx, gz, 1, nx, nz);
      for (let k = 0; k < pts.length - 1; k++) {
        const t0 = start + k * 2;
        idx.push(t0, t0 + 1, t0 + 2, t0 + 2, t0 + 1, t0 + 3);
      }
    };
    const row = (j: number) => Array.from({ length: NX + 1 }, (_, i) => [i / NX, j] as [number, number]);
    const col = (i: number) => Array.from({ length: NZ + 1 }, (_, j) => [i, j / NZ] as [number, number]);
    edge(row(1), 0, 1);
    edge(row(0), 0, -1);
    edge(col(0), -1, 0);
    edge(col(1), 1, 0);
    this.count = idx.length;

    const aGrid = gl.getAttribLocation(p, "aGrid"),
      aSkirt = gl.getAttribLocation(p, "aSkirt"),
      aSide = gl.getAttribLocation(p, "aSide");
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aGrid);
    gl.vertexAttribPointer(aGrid, 2, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(aSkirt);
    gl.vertexAttribPointer(aSkirt, 1, gl.FLOAT, false, 20, 8);
    gl.enableVertexAttribArray(aSide);
    gl.vertexAttribPointer(aSide, 2, gl.FLOAT, false, 20, 12);
    this.vao = vao;

    const q = gl.createVertexArray()!;
    gl.bindVertexArray(q);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aGrid);
    gl.vertexAttribPointer(aGrid, 2, gl.FLOAT, false, 8, 0);
    gl.disableVertexAttribArray(aSkirt);
    gl.disableVertexAttribArray(aSide);
    gl.vertexAttrib1f(aSkirt, 0);
    gl.vertexAttrib2f(aSide, 0, 0);
    this.quad = q;
    gl.bindVertexArray(null);

    gl.useProgram(p);
    gl.uniform1i(this.u.uHeight!, 0);
    gl.uniform1i(this.u.uWadi!, 1);
    gl.uniform2f(this.u.uTexel!, 1 / TW, 1 / TH);
    gl.uniform1f(this.u.uBase!, 0.1);
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.wake();
  }

  get aspect() {
    return this.w / this.h;
  }
  get width() {
    return this.w;
  }
  get height() {
    return this.h;
  }
  /** Current heading in radians, including any drag. */
  get heading() {
    return this.view.yaw + this.dragYaw.x;
  }
  /** How far the sheet is currently lifted out of the flat (0 flat … 1 strongly tilted). */
  get lift() {
    return Math.min(1, Math.max(0, -this.dragPitch.x / 0.85));
  }

  setView(v: Partial<View>, instant = false) {
    for (const k of KEYS) {
      const val = v[k];
      if (val === undefined) continue;
      const s = this.springs[k];
      s.target = val;
      if (instant || this.reducedMotion) {
        s.x = val;
        s.v = 0;
      }
    }
    this.wake();
  }
  get view(): View {
    return Object.fromEntries(KEYS.map((k) => [k, this.springs[k].x])) as unknown as View;
  }
  get settled() {
    return KEYS.every((k) => settled(this.springs[k]));
  }

  setFocus(x: number, z: number, on: boolean) {
    if (on) this.focus = [x, z];
    this.focusS.target = on ? 1 : 0;
    this.wake();
  }

  /** Drag turns the model; on release it springs back to rest. */
  dragBy(dyaw: number, dpitch: number) {
    this.dragging = true;
    this.dragYaw.target = Math.max(-1.2, Math.min(1.2, this.dragYaw.target + dyaw));
    this.dragPitch.target = Math.max(-0.85, Math.min(0.3, this.dragPitch.target + dpitch));
    this.dragYaw.x = this.dragYaw.target;
    this.dragPitch.x = this.dragPitch.target;
    this.dragYaw.v = this.dragPitch.v = 0;
    this.wake();
  }
  release(vyaw = 0) {
    this.dragging = false;
    this.dragYaw.v = vyaw;
    this.dragYaw.target = 0;
    this.dragPitch.target = 0;
    this.wake();
  }
  /** A small lean toward the pointer, for desktop. */
  lean(yaw: number, pitch: number) {
    if (this.dragging) return;
    this.dragYaw.target = yaw;
    this.dragPitch.target = pitch;
    this.wake();
  }
  setSun(dir: Vec3) {
    this.sun = dir;
    this.wake();
  }
  setDark(d: boolean) {
    this.dark = d;
    this.wake();
  }
  flatten(on: boolean) {
    this.yScale.target = on ? 0.02 : 1;
    this.wake();
  }

  wake() {
    this.dirty = true;
    if (!this.raf && this.visible) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  private tick = (t: number) => {
    this.raf = 0;
    const dt = Math.min(0.1, Math.max(0.001, (t - this.last) / 1000));
    this.last = t;
    let moving = false;
    for (const k of KEYS) {
      const s = this.springs[k];
      stepSpring(s, dt, 4.2);
      if (settled(s)) s.x = s.target;
      else moving = true;
    }
    for (const s of [this.dragYaw, this.dragPitch]) {
      if (!this.dragging) stepSpring(s, dt, 6.5);
      if (!settled(s)) moving = true;
    }
    stepSpring(this.focusS, dt, 5);
    stepSpring(this.yScale, dt, 4);
    stepSpring(this.shiftS, dt, 3.6);
    if (!settled(this.focusS) || !settled(this.yScale) || !settled(this.shiftS)) moving = true;
    const living = this.alive && !this.reducedMotion && !document.hidden;
    const idleDue = living && t - this.lastRender > 1000 / 30;
    if (moving || this.dirty || idleDue) {
      this.render();
      this.lastRender = t;
      this.onFrame?.(this);
    }
    this.dirty = false;
    if ((moving || living) && this.visible) this.raf = requestAnimationFrame(this.tick);
  };

  private camera() {
    const v = this.view;
    const life = this.alive && !this.reducedMotion ? 1 : 0;
    const tt = (performance.now() - this.t0) / 1000;
    const yaw = v.yaw + this.dragYaw.x + life * 0.045 * Math.sin(tt / 9);
    const pitch = Math.max(0.1, Math.min(1.5697, v.pitch + this.dragPitch.x + life * 0.018 * Math.sin(tt / 13 + 1)));
    const target: Vec3 = [v.tx, 0.05 * (1 - v.map), v.tz];
    const dist = v.dist * (1 - 0.3 * this.lift);
    const eye: Vec3 = [target[0] + dist * Math.cos(pitch) * Math.sin(yaw), target[1] + dist * Math.sin(pitch), target[2] + dist * Math.cos(pitch) * Math.cos(yaw)];
    const up: Vec3 = [-Math.sin(yaw), 0, -Math.cos(yaw)]; // "forward" is screen-up at every pitch
    const proj = this.shifted(perspective(v.fov, this.w / this.h, 0.03, 40));
    // the vertical scale toy squashes the world in y
    const s = new Float32Array([1, 0, 0, 0, 0, Math.max(0.02, this.yScale.x), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.vp = mul(mul(proj, lookAt(eye, target, up)), s);
    this.eye = eye;
    this.camDist = dist;
    return v;
  }

  render() {
    const gl = this.gl;
    const v = this.camera();
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const hz = this.dark ? [22 / 255, 27 / 255, 34 / 255] : [232 / 255, 228 / 255, 218 / 255];
    gl.clearColor(hz[0]!, hz[1]!, hz[2]!, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.u.uVP!, false, this.vp);
    gl.uniform3fv(this.u.uSun!, this.sun);
    gl.uniform1f(this.u.uMap!, v.map);
    gl.uniform1f(this.u.uDark!, this.dark ? 1 : 0);
    // world units per pixel at the target: picks the contour interval (generalisation)
    const px = (2 * v.dist * Math.tan(v.fov / 2)) / this.h;
    gl.uniform1f(this.u.uPx!, px);
    const metresPerPx = px * KM_PER_UNIT * 1000;
    gl.uniform1f(this.u.uCI!, metresPerPx > 30 ? 100 : metresPerPx > 12 ? 50 : 20);
    gl.uniform3f(this.u.uFocus!, this.focus[0], this.focus[1], this.focusS.x);
    gl.uniform3fv(this.u.uEye!, this.eye);
    gl.uniform2f(this.u.uFog!, this.camDist * 1.15, this.camDist * 3.2);
    gl.uniform1f(this.u.uTime!, (performance.now() - this.t0) / 1000);
    gl.uniform1f(this.u.uLife!, this.alive && !this.reducedMotion ? 1 : 0);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.uniform1i(this.u.uMode!, 0);
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);
  }

  /** The largest camera distance at which the sheet still covers the whole canvas (no edges in view). */
  coverDistance(v: Omit<View, "dist">, inset = 0.985): number {
    const t = Math.tan(v.fov / 2),
      a = this.w / this.h;
    const fx = -Math.cos(v.pitch) * Math.sin(v.yaw),
      fy = -Math.sin(v.pitch),
      fz = -Math.cos(v.pitch) * Math.cos(v.yaw);
    // right = forward × worldUp(0,1,0); up = right × forward
    let rx = -fz,
      rz = fx;
    const rl = Math.hypot(rx, rz) || 1;
    rx /= rl;
    rz /= rl;
    const ux = -rz * fy,
      uy = rz * fx - rx * fz,
      uz = rx * fy;
    const ground = 0.0;
    const covers = (dist: number) => {
      const ex = v.tx - fx * dist,
        ey = 0.05 * (1 - v.map) - fy * dist,
        ez = v.tz - fz * dist;
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const dx = fx + sx * t * a * rx + sy * t * ux,
            dy = fy + sy * t * uy,
            dz = fz + sx * t * a * rz + sy * t * uz;
          if (dy >= -1e-4) return false;
          const k = (ground - ey) / dy;
          const hx = ex + dx * k,
            hz = ez + dz * k;
          if (Math.abs(hx) > HALF_W * inset || Math.abs(hz) > HALF_D * inset) return false;
        }
      return true;
    };
    let lo = 0.2,
      hi = 12;
    if (!covers(lo)) return lo;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (covers(mid)) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  /** Lens shift: move the image right by leftFrac of the canvas without moving the camera. */
  private shifted(p: Float32Array) {
    const s = this.leftFrac; // NDC shift = 2 * frac / 2
    if (!s) return p;
    const t = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, s, 0, 0, 1]);
    return mul(t, p);
  }

  /** The camera distance at which the whole block fits the canvas with `pad` (NDC, <1 leaves margin). */
  fitDistance(v: Omit<View, "dist">, pad = 0.92): number {
    const corners: Vec3[] = [];
    for (const x of [-HALF_W, HALF_W]) for (const z of [-HALF_D, HALF_D]) for (const y of [-0.1, 0.3]) corners.push([x, y, z]);
    const fits = (dist: number) => {
      const yaw = v.yaw, pitch = v.pitch;
      const target: Vec3 = [v.tx, 0.05 * (1 - v.map), v.tz];
      const eye: Vec3 = [target[0] + dist * Math.cos(pitch) * Math.sin(yaw), target[1] + dist * Math.sin(pitch), target[2] + dist * Math.cos(pitch) * Math.cos(yaw)];
      const up: Vec3 = [-Math.sin(yaw), 0, -Math.cos(yaw)]; // "forward" is screen-up at every pitch
      const m = mul(perspective(v.fov, this.w / this.h, 0.03, 40), lookAt(eye, target, up));
      return corners.every(([x, y, z]) => {
        const cx = m[0]! * x + m[4]! * y + m[8]! * z + m[12]!;
        const cy = m[1]! * x + m[5]! * y + m[9]! * z + m[13]!;
        const cw = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!;
        return cw > 0 && Math.abs(cx / cw) <= pad * (1 - this.shiftS.target) && Math.abs(cy / cw) <= pad;
      });
    };
    let lo = 0.5, hi = 20;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) hi = mid;
      else lo = mid;
    }
    return hi;
  }

  /** World → CSS pixels. */
  project(x: number, y: number, z: number): { x: number; y: number; ok: boolean } {
    const m = this.vp;
    const cx = m[0]! * x + m[4]! * y + m[8]! * z + m[12]!;
    const cy = m[1]! * x + m[5]! * y + m[9]! * z + m[13]!;
    const cw = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!;
    if (cw <= 0) return { x: 0, y: 0, ok: false };
    return { x: ((cx / cw) * 0.5 + 0.5) * this.w, y: (1 - ((cy / cw) * 0.5 + 0.5)) * this.h, ok: true };
  }

  stop() {
    void this.quad;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}
