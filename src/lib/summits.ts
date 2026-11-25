import { getCollection, type CollectionEntry } from "astro:content";
import meta from "../../public/terrain/jais.json";

export type Route = CollectionEntry<"routes">;

export interface PlacedSummit {
  slug: string;
  name: string;
  featured: boolean;
  grade: string;
  x: number;
  z: number;
  metres: number;
}

/**
 * Routes are placed on real peaks of the massif: in order, each takes the highest
 * remaining peak that isn't crowding one already taken. The flagship gets the summit.
 */
export function placeSummits(routes: Route[]): PlacedSummit[] {
  const peaks = [...meta.peaks].sort((a, b) => b.m - a.m);
  const taken: PlacedSummit[] = [];
  for (const r of routes) {
    // the visited summits spread across the sheet; the rest fill in between
    const minGap = r.data.featured ? 0.62 : 0.3;
    const peak = peaks.find((p) => taken.every((t) => Math.hypot(t.x - p.x, t.z - p.z) >= minGap) && Math.abs(p.x) < 1.42 && Math.abs(p.z) < 0.86);
    if (!peak) break;
    peaks.splice(peaks.indexOf(peak), 1);
    taken.push({ slug: r.id, name: r.data.summit, featured: r.data.featured, grade: r.data.grade, x: peak.x, z: peak.z, metres: peak.m });
  }
  return taken;
}

export async function routesInOrder(): Promise<Route[]> {
  const all = await getCollection("routes", (r) => import.meta.env.DEV || !r.data.draft);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export const terrainMeta = meta;
