import type { HazardCategory, HazardCluster, HazardReport } from "@/types/hazard";

export type ResponseLevel = "deploy" | "watch" | "none";

export interface ResponseAdvice {
  level: ResponseLevel;
  headline: string;
  reasons: string[];
  /** Suggested teams. The authority can add or remove any of them. */
  units: string[];
}

export interface ResponseDecision {
  decision: "deploy" | "watch" | "dismiss";
  units: string[];
  decidedAt: string;
}

/** A medium-severity hotspot with this many reports is treated as serious. */
export const BIG_HOTSPOT_REPORTS = 10;

const UNITS: Record<HazardCategory, string[]> = {
  flooding: ["Fire and rescue team", "Disaster response cell", "Traffic police"],
  pothole: ["Road repair crew", "Traffic police"],
  ewaste: ["Hazardous waste team"],
  plastic: ["Sanitation team"],
};

/**
 * Cluster ids ("flooding-cluster-02") are renumbered whenever new reports arrive, so a saved decision
 * is keyed by category + earliest report instead. That stays the same while the hotspot grows.
 */
export function dispatchKey(cluster: HazardCluster): string {
  return `${cluster.category}:${cluster.reportIds[0] ?? cluster.id}`;
}

export function recommendResponse(cluster: HazardCluster, reports: readonly HazardReport[]): ResponseAdvice {
  const members = new Set(cluster.reportIds);
  const askedForHelp = reports.filter((r) => members.has(r.id) && r.needsResponse).length;
  const big = cluster.reportCount >= BIG_HOTSPOT_REPORTS;

  const reasons: string[] = [];
  if (cluster.severity === "high") reasons.push("Severity is high: reporters say it is dangerous.");
  if (askedForHelp > 0) reasons.push(`${askedForHelp} ${askedForHelp === 1 ? "reporter asked" : "reporters asked"} for a team to be sent.`);
  if (cluster.severity === "medium" && big) reasons.push(`${cluster.reportCount} reports: many people are affected.`);

  const deploy = cluster.severity === "high" || askedForHelp > 0 || (cluster.severity === "medium" && big);
  if (deploy) {
    return { level: "deploy", headline: "Recommended: send a team", reasons, units: [...UNITS[cluster.category]] };
  }
  if (cluster.severity === "medium") {
    return { level: "watch", headline: "Recommended: keep watching", reasons: ["Severity is medium: wait for more reports before sending a team."], units: [] };
  }
  return { level: "none", headline: "No team needed for now", reasons: ["Severity is low: nobody is reported to be in danger."], units: [] };
}
/** Default teams for a hazard type. */
export const unitsFor = (category: HazardCategory): string[] => [...UNITS[category]];