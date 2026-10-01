import { describe, expect, it } from "vitest";
import type { HazardCluster, HazardReport } from "../src/types/hazard";
import { BIG_HOTSPOT_REPORTS, dispatchKey, recommendResponse } from "../src/lib/response";

const report = (id: string, extra: Partial<HazardReport> = {}): HazardReport => ({
  id, latitude: 18.52, longitude: 73.85, timestamp: "2026-09-30T05:00:00Z", category: "flooding", severity: "medium", ...extra,
});
const cluster = (over: Partial<HazardCluster> = {}): HazardCluster => ({
  id: "flooding-cluster-01", category: "flooding", latitude: 18.52, longitude: 73.85, reportCount: 5, severity: "medium",
  reportIds: ["a", "b", "c", "d", "e"], detectedAt: "2026-09-30T05:10:00Z", status: "validated", ...over,
});

describe("recommendResponse", () => {
  it("recommends a team for high severity", () => {
    const a = recommendResponse(cluster({ severity: "high" }), []);
    expect(a.level).toBe("deploy");
    expect(a.units).toContain("Fire and rescue team");
  });
  it("recommends a team when a reporter asked for help, even at medium severity", () => {
    const a = recommendResponse(cluster(), [report("c", { needsResponse: true })]);
    expect(a.level).toBe("deploy");
    expect(a.reasons.join(" ")).toMatch(/1 reporter asked/);
  });
  it("ignores help requests from reports outside the hotspot", () => {
    expect(recommendResponse(cluster(), [report("zzz", { needsResponse: true })]).level).toBe("watch");
  });
  it("escalates a medium hotspot once it has many reports", () => {
    const ids = Array.from({ length: BIG_HOTSPOT_REPORTS }, (_, i) => `r${i}`);
    expect(recommendResponse(cluster({ reportCount: ids.length, reportIds: ids }), []).level).toBe("deploy");
    expect(recommendResponse(cluster({ reportCount: BIG_HOTSPOT_REPORTS - 1 }), []).level).toBe("watch");
  });
  it("needs no team for low severity", () => {
    const a = recommendResponse(cluster({ severity: "low" }), []);
    expect(a.level).toBe("none");
    expect(a.units).toEqual([]);
  });
});

describe("dispatchKey", () => {
  it("does not change when the cluster is renumbered or grows", () => {
    expect(dispatchKey(cluster({ id: "flooding-cluster-01" }))).toBe(dispatchKey(cluster({ id: "flooding-cluster-07", reportIds: ["a", "b", "c", "d", "e", "f"] })));
  });
});