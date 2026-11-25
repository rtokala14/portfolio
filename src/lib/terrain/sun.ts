/**
 * Where the sun is over Dubai right now (NOAA's simplified solar position).
 * Accurate to well under a degree, which is plenty for lighting a relief model.
 */
export const DUBAI = { lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai" } as const;

export interface SunPosition {
  /** Degrees clockwise from north. */
  azimuth: number;
  /** Degrees above the horizon (negative at night). */
  elevation: number;
}

const rad = Math.PI / 180;

export function sunPosition(date: Date, lat = DUBAI.lat, lon = DUBAI.lon): SunPosition {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * rad;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const eps = (23.439 - 0.0000004 * n) * rad;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const lst = (gmst * 15 + lon) * rad;
  const ha = lst - ra;
  const phi = lat * rad;
  const el = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha));
  const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(ha));
  return { azimuth: ((az / rad) % 360 + 360) % 360, elevation: el / rad };
}

/** Light direction in world space (y up, -z north) from azimuth/elevation in degrees. */
export function lightDir(azimuth: number, elevation: number): [number, number, number] {
  const a = azimuth * rad,
    e = elevation * rad;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
}

export function dubaiClock(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: DUBAI.tz, hour: "2-digit", minute: "2-digit" }).format(date);
}
