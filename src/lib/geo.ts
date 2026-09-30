import type { HazardCluster, HazardReport } from "@/types/hazard";

export type LatLngTuple = [number, number];

const EARTH_RADIUS_M = 6_371_000;
const MIN_RADIUS_M = 120;
const RADIUS_PADDING_M = 60;
const FALLBACK_RADIUS_M = 300;

/** Display-only distance helper (used to size the hotspot circle). Not clustering. */
export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function indexReports(reports: readonly HazardReport[]): Map<string, HazardReport> {
  return new Map(reports.map((r) => [r.id, r]));
}

/** Reports referenced by cluster.reportIds that are present in the loaded set. */
export function getContributingReports(
  cluster: HazardCluster,
  byId: ReadonlyMap<string, HazardReport>,
): HazardReport[] {
  const found: HazardReport[] = [];
  for (const id of cluster.reportIds) {
    const r = byId.get(id);
    if (r) found.push(r);
  }
  return found;
}

/** Circle radius (metres) that visually covers the cluster's contributing reports. */
export function clusterRadiusMeters(
  cluster: HazardCluster,
  byId: ReadonlyMap<string, HazardReport>,
): number {
  const members = getContributingReports(cluster, byId);
  if (members.length === 0) return FALLBACK_RADIUS_M;
  let farthest = 0;
  for (const r of members) {
    farthest = Math.max(
      farthest,
      haversineMeters(cluster.latitude, cluster.longitude, r.latitude, r.longitude),
    );
  }
  return Math.max(MIN_RADIUS_M, Math.ceil(farthest + RADIUS_PADDING_M));
}

/** Centroid + contributing report positions, for fitting the map to one hotspot. */
export function pointsForCluster(
  cluster: HazardCluster,
  byId: ReadonlyMap<string, HazardReport>,
): LatLngTuple[] {
  return [
    [cluster.latitude, cluster.longitude],
    ...getContributingReports(cluster, byId).map((r): LatLngTuple => [r.latitude, r.longitude]),
  ];
}
