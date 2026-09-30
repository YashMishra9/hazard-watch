/**
 * Single data-access layer for the UI. Nothing else touches localStorage.
 *
 * INTEGRATION POINTS
 *  - Developer 2 (ST-DBSCAN): either call `hazardService.setClusters(clusters)` after running the
 *    algorithm, or call `registerClusterProvider((reports) => runStDbscan(reports))` once at startup.
 *    To load the deterministic demo dataset call `hazardService.setReports(demoReports)`.
 *  - Developer 3 (map/alerts): read with `useHazardData()` (src/hooks) or `hazardService.getReports()` /
 *    `getClusters()`. Every write notifies subscribers, so the map and dashboard stay in sync.
 * Methods are async so this file can later be swapped for fetch() calls with no UI changes.
 */
import type { HazardCluster, HazardReport } from "@/types/hazard";
import { runSTDBSCAN } from "@/lib/clustering";

const REPORTS_KEY = "hazard.reports.v1";
const CLUSTERS_KEY = "hazard.clusters.v1";
const EVENT = "hazard-data-changed";

type ClusterProvider = (reports: HazardReport[]) => HazardCluster[] | Promise<HazardCluster[]>;
let clusterProvider: ClusterProvider | null = runSTDBSCAN;

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`Stored data for ${key} is corrupted.`);
  return parsed as T[];
}

function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
}

export function registerClusterProvider(provider: ClusterProvider | null) {
  clusterProvider = provider;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function createReportId() {
  return `rpt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const hazardService = {
  async getReports(): Promise<HazardReport[]> {
    return read<HazardReport>(REPORTS_KEY);
  },
  async addReport(input: Omit<HazardReport, "id" | "timestamp">): Promise<HazardReport> {
    const report: HazardReport = { ...input, id: createReportId(), timestamp: new Date().toISOString() };
    write(REPORTS_KEY, [report, ...read<HazardReport>(REPORTS_KEY)]);
    return report;
  },
  async setReports(reports: HazardReport[]) {
    write(REPORTS_KEY, reports);
  },
  async clearReports() {
    write(REPORTS_KEY, []);
  },
  async getClusters(reports?: HazardReport[]): Promise<HazardCluster[]> {
    if (clusterProvider) return clusterProvider(reports ?? read<HazardReport>(REPORTS_KEY));
    return read<HazardCluster>(CLUSTERS_KEY);
  },
  async setClusters(clusters: HazardCluster[]) {
    write(CLUSTERS_KEY, clusters);
  },
  subscribe(listener: () => void) {
    const onStorage = (e: StorageEvent) => {
      if (e.key === REPORTS_KEY || e.key === CLUSTERS_KEY) listener();
    };
    window.addEventListener(EVENT, listener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, listener);
      window.removeEventListener("storage", onStorage);
    };
  },
};
