import type { HazardCluster } from "@/types/hazard";
import { SEVERITY_META } from "@/components/map/mapConfig";

/** UI-level wrapper around a validated cluster. Not a duplicate of HazardCluster. */
export interface HazardAlert {
  id: string;
  clusterId: string;
  cluster: HazardCluster;
  /** Alert time = time the hazard was validated. */
  createdAt: string;
  read: boolean;
}

export const alertIdForCluster = (clusterId: string) => `alert:${clusterId}`;

function time(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * One alert per validated cluster. Most severe first, then most recent,
 * then largest report count.
 */
export function buildAlerts(
  clusters: readonly HazardCluster[],
  readIds: ReadonlySet<string>,
): HazardAlert[] {
  return clusters
    .filter((c) => c.status === "validated")
    .map((cluster): HazardAlert => {
      const id = alertIdForCluster(cluster.id);
      return { id, clusterId: cluster.id, cluster, createdAt: cluster.detectedAt, read: readIds.has(id) };
    })
    .sort(
      (a, b) =>
        SEVERITY_META[b.cluster.severity].rank - SEVERITY_META[a.cluster.severity].rank ||
        time(b.createdAt) - time(a.createdAt) ||
        b.cluster.reportCount - a.cluster.reportCount,
    );
}

export const countUnread = (alerts: readonly HazardAlert[]) => alerts.filter((a) => !a.read).length;
