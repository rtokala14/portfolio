/**
 * The terrain: the Jebel Jais massif, Ras Al Khaimah, from open elevation data
 * (baked by scripts/bake-terrain.py into public/terrain/).
 *
 * World units: x ∈ [-HALF_W, HALF_W] west→east, z ∈ [-HALF_D, HALF_D] north→south.
 * The sheet is 34 km across, so one world unit is 10.625 km.
 */

export const HALF_W = 1.6;
export const HALF_D = 1.0;
export const KM_PER_UNIT = 34 / 3.2;
/** Vertical exaggeration of the relief model (cartographic reliefs use 1.3–2×). */
export const EXAGGERATION = 1.75;
/** World y for an elevation in metres. */
export const yOf = (m: number) => (m / (KM_PER_UNIT * 1000)) * EXAGGERATION;

export interface Peak {
  x: number;
  z: number;
  m: number;
}
export interface TerrainMeta {
  width: number;
  height: number;
  spanKm: number;
  bounds: { west: number; east: number; north: number; south: number };
  min: number;
  max: number;
  peaks: Peak[];
  attribution: string;
}

export class Terrain {
  constructor(
    readonly meta: TerrainMeta,
    readonly metres: Float32Array,
    readonly wadi: Uint8Array,
  ) {}

  static async load(base = "/terrain/jais"): Promise<Terrain> {
    const [meta, bin, wadi] = await Promise.all([
      fetch(`${base}.json`).then((r) => r.json() as Promise<TerrainMeta>),
      fetch(`${base}.bin`).then((r) => r.arrayBuffer()),
      fetch(`${base}-wadi.bin`).then((r) => r.arrayBuffer()),
    ]);
    const u16 = new Uint16Array(bin);
    const f = new Float32Array(u16.length);
    for (let i = 0; i < u16.length; i++) f[i] = u16[i]!;
    return new Terrain(meta, f, new Uint8Array(wadi));
  }

  /** Grid coordinates for a world position. */
  private grid(x: number, z: number) {
    const { width: W, height: H } = this.meta;
    return { gx: ((x / HALF_W + 1) / 2) * (W - 1), gz: ((z / HALF_D + 1) / 2) * (H - 1) };
  }

  /** Elevation in metres at a world position (bilinear). */
  metresAt(x: number, z: number): number {
    const { width: W, height: H } = this.meta;
    const { gx, gz } = this.grid(x, z);
    const i = Math.max(0, Math.min(W - 2, Math.floor(gx)));
    const j = Math.max(0, Math.min(H - 2, Math.floor(gz)));
    const fx = Math.min(1, Math.max(0, gx - i)),
      fz = Math.min(1, Math.max(0, gz - j));
    const m = this.metres;
    const a = m[j * W + i]!,
      b = m[j * W + i + 1]!,
      c = m[(j + 1) * W + i]!,
      d = m[(j + 1) * W + i + 1]!;
    return a * (1 - fx) * (1 - fz) + b * fx * (1 - fz) + c * (1 - fx) * fz + d * fx * fz;
  }

  yAt(x: number, z: number) {
    return yOf(this.metresAt(x, z));
  }

  /** Latitude/longitude of a world position, for the map margin. */
  lonLat(x: number, z: number): [number, number] {
    const b = this.meta.bounds;
    return [b.west + ((x / HALF_W + 1) / 2) * (b.east - b.west), b.north - ((z / HALF_D + 1) / 2) * (b.north - b.south)];
  }
}
