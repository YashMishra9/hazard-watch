/**
 * Geographic helpers: Haversine distance and centroid.
 * Pure functions, no dependencies.
 */

/** Mean Earth radius in metres (IUGG). */
export const EARTH_RADIUS_METERS = 6_371_008.8;

export interface LatLng {
  latitude: number;
  longitude: number;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Great-circle distance between two points, in metres (Haversine formula).
 *
 *   a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)
 *   d = 2 · R · asin(√a)
 */
export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  // Math.min guards against h creeping just above 1 through rounding.
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Round to 6 decimal places (~0.1 m) so output is stable and readable. */
export function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/**
 * Centroid = arithmetic mean of latitudes and longitudes.
 * For a cluster only a few hundred metres across (city scale) this is
 * indistinguishable from a true spherical centroid.
 */
export function centroid(points: readonly LatLng[]): LatLng {
  if (points.length === 0) {
    throw new RangeError("centroid() needs at least one point");
  }
  let latSum = 0;
  let lonSum = 0;
  for (const p of points) {
    latSum += p.latitude;
    lonSum += p.longitude;
  }
  return {
    latitude: round6(latSum / points.length),
    longitude: round6(lonSum / points.length),
  };
}
