import type { HazardCluster, HazardReport } from "@/types/hazard";

/**
 * The two functions Developer 2 supplies. HazardMonitor never fabricates
 * results: whatever these return is exactly what the map and alerts show.
 */
export type LoadDemoData = () => HazardReport[] | Promise<HazardReport[]>;
export type RunHazardAnalysis = (reports: HazardReport[]) => HazardCluster[] | Promise<HazardCluster[]>;
