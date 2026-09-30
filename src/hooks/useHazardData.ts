"use client";
import { useCallback, useEffect, useState } from "react";
import type { HazardCluster, HazardReport } from "@/types/hazard";
import { hazardService } from "@/lib/hazardService";

export type LoadStatus = "loading" | "ready" | "error";

export function useHazardData() {
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [clusters, setClusters] = useState<HazardCluster[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await hazardService.getReports();
      const c = await hazardService.getClusters(r);
      setReports(r);
      setClusters(c);
      setError(null);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load hazard data.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
    return hazardService.subscribe(load);
  }, [load]);

  return { reports, clusters, status, error, reload: load };
}
