import type { HazardCategory, HazardReport, Severity } from "../src/types/hazard";
import { EARTH_RADIUS_METERS } from "../src/lib/clustering/geo";

export const BASE_LAT = 18.5204; // central Pune
export const BASE_LON = 73.8567;
export const BASE_TIME_MS = Date.parse("2026-07-14T09:00:00.000Z");

/** Move `meters` north of a latitude (exact along a meridian). */
export function northOf(lat: number, meters: number): number {
  return lat + ((meters / EARTH_RADIUS_METERS) * 180) / Math.PI;
}

export function mk(
  id: string,
  opts: {
    lat?: number;
    lon?: number;
    minute?: number;
    category?: HazardCategory;
    severity?: Severity;
    timestamp?: string;
  } = {},
): HazardReport {
  return {
    id,
    latitude: opts.lat ?? BASE_LAT,
    longitude: opts.lon ?? BASE_LON,
    timestamp:
      opts.timestamp ??
      new Date(BASE_TIME_MS + (opts.minute ?? 0) * 60_000).toISOString(),
    category: opts.category ?? "flooding",
    severity: opts.severity ?? "medium",
  };
}

/** n reports at (almost) the same spot, `stepMinutes` apart. */
export function group(
  prefix: string,
  n: number,
  o: { lat?: number; lon?: number; startMinute?: number; stepMinutes?: number; category?: HazardCategory; severity?: Severity } = {},
): HazardReport[] {
  return Array.from({ length: n }, (_, i) =>
    mk(`${prefix}-${i + 1}`, {
      lat: o.lat,
      lon: o.lon,
      minute: (o.startMinute ?? 0) + i * (o.stepMinutes ?? 1),
      category: o.category,
      severity: o.severity,
    }),
  );
}
