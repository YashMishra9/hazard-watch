import { describe, it, expect } from "vitest";
import { PUNE_DEMO_REPORTS, getPuneDemoReports } from "../src/lib/demo-data";
import { runSTDBSCAN, runSTDBSCANDetailed } from "../src/lib/clustering";

describe("Pune demo dataset", () => {
  it("is deterministic (identical on every load)", () => {
    expect(getPuneDemoReports()).toEqual([...PUNE_DEMO_REPORTS]);
  });

  it("has unique ids, valid fields and all 4 categories and 3 severities", () => {
    const ids = new Set(PUNE_DEMO_REPORTS.map((r) => r.id));
    expect(ids.size).toBe(PUNE_DEMO_REPORTS.length);
    expect(new Set(PUNE_DEMO_REPORTS.map((r) => r.category))).toEqual(
      new Set(["flooding", "pothole", "ewaste", "plastic"]),
    );
    expect(new Set(PUNE_DEMO_REPORTS.map((r) => r.severity))).toEqual(
      new Set(["low", "medium", "high"]),
    );
    for (const r of PUNE_DEMO_REPORTS) {
      expect(r.latitude).toBeGreaterThan(18.4);
      expect(r.latitude).toBeLessThan(18.7);
      expect(r.longitude).toBeGreaterThan(73.7);
      expect(r.longitude).toBeLessThan(74.0);
      expect(Number.isFinite(Date.parse(r.timestamp))).toBe(true);
    }
  });

  it("yields exactly the 7 expected validated clusters when clustered", () => {
    const r = runSTDBSCANDetailed(PUNE_DEMO_REPORTS);
    expect(r.invalidReportIds).toEqual([]);
    expect(r.clusters).toHaveLength(7);

    const summary = r.clusters
      .map((c) => `${c.category}:${c.reportCount}:${c.severity}`)
      .sort();
    expect(summary).toEqual(
      [
        "flooding:7:high",   // Dandekar Bridge
        "flooding:5:medium", // Karve Road
        "pothole:6:high",    // Katraj-Kondhwa (tie 2.5 → high)
        "pothole:5:low",     // Hinjewadi
        "ewaste:5:medium",   // FC Road
        "plastic:8:medium",  // Hadapsar
        "plastic:6:high",    // Pune Station
      ].sort(),
    );

    const clustered = r.clusters.reduce((n, c) => n + c.reportCount, 0);
    expect(clustered).toBe(42);
    expect(r.unclusteredReportIds).toHaveLength(PUNE_DEMO_REPORTS.length - 42);
  });

  it("deliberate near-misses stay unclustered", () => {
    const clusters = runSTDBSCAN(PUNE_DEMO_REPORTS);
    const clusteredIds = new Set(clusters.flatMap((c) => c.reportIds));
    const byDescription = (text: string) =>
      PUNE_DEMO_REPORTS.filter((r) => r.description?.includes(text));

    for (const text of [
      "Pothole along a long road",   // Wakad: far apart
      "Recurring puddle",            // Viman Nagar: too far apart in time
      "Plastic litter at the flooded stretch", // only 4
      "Swargate",                    // mixed categories
      "Late report at Dandekar",     // right place, wrong time
      "Pothole 1.5 km east",         // right time, wrong place
      "Late plastic report",         // right place, wrong time
      "Isolated",                    // noise
    ]) {
      const group = byDescription(text);
      expect(group.length).toBeGreaterThan(0);
      for (const r of group) expect(clusteredIds.has(r.id)).toBe(false);
    }
  });

  it("preserves every report ID exactly once and only real IDs", () => {
    const real = new Set(PUNE_DEMO_REPORTS.map((r) => r.id));
    const all = runSTDBSCAN(PUNE_DEMO_REPORTS).flatMap((c) => c.reportIds);
    expect(new Set(all).size).toBe(all.length);
    for (const id of all) expect(real.has(id)).toBe(true);
  });

  it("clusters land near the expected landmarks", () => {
    const clusters = runSTDBSCAN(PUNE_DEMO_REPORTS);
    const hadapsar = clusters.find((c) => c.category === "plastic" && c.reportCount === 8)!;
    expect(Math.abs(hadapsar.latitude - 18.5089)).toBeLessThan(0.005);
    expect(Math.abs(hadapsar.longitude - 73.926)).toBeLessThan(0.005);
  });
});
