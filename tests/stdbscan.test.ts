import { describe, it, expect } from "vitest";
import {
  runSTDBSCAN,
  runSTDBSCANDetailed,
  DEFAULT_ST_DBSCAN_OPTIONS,
  haversineDistanceMeters,
  aggregateSeverity,
} from "../src/lib/clustering";
import type { HazardReport, Severity } from "../src/types/hazard";
import { BASE_LAT, group, mk, northOf } from "./helpers";

describe("defaults", () => {
  it("are 500 m / 30 min / 5 reports", () => {
    expect(DEFAULT_ST_DBSCAN_OPTIONS.spatialRadiusMeters).toBe(500);
    expect(DEFAULT_ST_DBSCAN_OPTIONS.temporalWindowMinutes).toBe(30);
    expect(DEFAULT_ST_DBSCAN_OPTIONS.minReports).toBe(5);
  });
});

describe("required scenarios", () => {
  it("1. five nearby reports within 30 min → one validated cluster", () => {
    const reports = group("R", 5, { stepMinutes: 5 });
    const clusters = runSTDBSCAN(reports);
    expect(clusters).toHaveLength(1);
    const c = clusters[0]!;
    expect(c.status).toBe("validated");
    expect(c.reportCount).toBe(5);
    expect(c.category).toBe("flooding");
    expect(c.reportIds).toEqual(["R-1", "R-2", "R-3", "R-4", "R-5"]);
  });

  it("2. five reports more than 500 m apart → no cluster", () => {
    const reports = Array.from({ length: 5 }, (_, i) =>
      mk(`S-${i}`, { lat: northOf(BASE_LAT, i * 600), minute: i }),
    );
    expect(runSTDBSCAN(reports)).toEqual([]);
  });

  it("3. five reports more than 30 min apart → no cluster", () => {
    const reports = group("T", 5, { stepMinutes: 31 });
    expect(runSTDBSCAN(reports)).toEqual([]);
  });

  it("4. nearby reports of different categories are processed separately", () => {
    // 3 + 3 + 2 co-located: 8 reports, but no single category has 5.
    const reports = [
      ...group("F", 3, { category: "flooding" }),
      ...group("P", 3, { category: "pothole" }),
      ...group("E", 2, { category: "ewaste" }),
    ];
    expect(runSTDBSCAN(reports)).toEqual([]);

    // 5 flooding + 4 plastic at the same place → only flooding is validated.
    const mixed = [...group("F", 5, { category: "flooding" }), ...group("P", 4, { category: "plastic" })];
    const out = runSTDBSCAN(mixed);
    expect(out).toHaveLength(1);
    expect(out[0]!.category).toBe("flooding");
    expect(out[0]!.reportIds.every((id) => id.startsWith("F-"))).toBe(true);
  });

  it("5. one isolated report → noise", () => {
    const r = runSTDBSCANDetailed([mk("only")]);
    expect(r.clusters).toEqual([]);
    expect(r.unclusteredReportIds).toEqual(["only"]);
  });

  it("5b. empty input → empty output", () => {
    expect(runSTDBSCAN([])).toEqual([]);
  });

  it("6. multiple separate clusters stay separate", () => {
    const a = group("A", 5, { category: "flooding" });
    const b = group("B", 6, { category: "flooding", lat: northOf(BASE_LAT, 5_000) }); // 5 km away
    const c = group("C", 5, { category: "flooding", startMinute: 300 }); // same place, 5 h later
    const clusters = runSTDBSCAN([...a, ...b, ...c]);
    expect(clusters).toHaveLength(3);
    expect(clusters.map((x) => x.reportCount).sort()).toEqual([5, 5, 6]);
    const ids = new Set(clusters.flatMap((x) => x.reportIds));
    expect(ids.size).toBe(16); // no report shared between clusters
    expect(new Set(clusters.map((x) => x.id)).size).toBe(3); // unique cluster ids
  });

  it("7. mixed severity aggregates deterministically", () => {
    const sev = (list: Severity[]) =>
      runSTDBSCAN(list.map((s, i) => mk(`M-${i}`, { severity: s, minute: i })))[0]!.severity;

    expect(sev(["low", "low", "low", "low", "low"])).toBe("low");
    expect(sev(["high", "high", "high", "high", "high"])).toBe("high");
    expect(sev(["low", "low", "medium", "medium", "medium"])).toBe("medium"); // 1.6
    expect(sev(["low", "low", "low", "medium", "medium"])).toBe("low"); // 1.4
    expect(sev(["medium", "medium", "medium", "high", "high"])).toBe("medium"); // 2.4
    expect(sev(["medium", "medium", "high", "high", "high"])).toBe("high"); // 2.6
    // exact tie 2.5 rounds up
    expect(
      sev(["medium", "medium", "medium", "high", "high", "high"]),
    ).toBe("high");
  });

  describe("8. boundaries", () => {
    /** 4 reports at the centre + 1 report `d` metres north. */
    const withFifthAt = (fifth: HazardReport) => [
      ...group("C", 4, { stepMinutes: 0 }),
      fifth,
    ];

    it("exactly on the 500 m limit is included; just outside is not", () => {
      const p = mk("edge", { lat: northOf(BASE_LAT, 500) });
      const d = haversineDistanceMeters(mk("x"), p); // ≈ 500 m
      expect(Math.abs(d - 500)).toBeLessThan(0.001);

      // Use the exact computed distance as radius → inclusive boundary.
      const inside = runSTDBSCAN(withFifthAt(p), { spatialRadiusMeters: d });
      expect(inside).toHaveLength(1);
      expect(inside[0]!.reportCount).toBe(5);

      // A hair smaller radius → the fifth report drops out → only 4 remain.
      const outside = runSTDBSCAN(withFifthAt(p), { spatialRadiusMeters: d - 0.001 });
      expect(outside).toEqual([]);
    });

    it("499 m clusters, 501 m does not (default options)", () => {
      expect(runSTDBSCAN(withFifthAt(mk("n", { lat: northOf(BASE_LAT, 499) })))).toHaveLength(1);
      expect(runSTDBSCAN(withFifthAt(mk("f", { lat: northOf(BASE_LAT, 501) })))).toEqual([]);
    });

    it("exactly 30:00 apart is included; 30:00.001 is not", () => {
      const four = group("C", 4, { stepMinutes: 0 });
      const at30 = mk("t30", { timestamp: "2026-07-14T09:30:00.000Z" });
      const justOver = mk("t30x", { timestamp: "2026-07-14T09:30:00.001Z" });
      expect(runSTDBSCAN([...four, at30])).toHaveLength(1);
      expect(runSTDBSCAN([...four, justOver])).toEqual([]);
    });

    it("exactly 5 reports validates, 4 does not", () => {
      expect(runSTDBSCAN(group("N", 5))).toHaveLength(1);
      expect(runSTDBSCAN(group("N", 4))).toEqual([]);
    });
  });
});

describe("noise and expansion", () => {
  it("noise next to a valid cluster is left out; cluster keeps its IDs", () => {
    const cluster = group("C", 5, { stepMinutes: 2 });
    const tooLate = mk("late", { minute: 120 });
    const tooFar = mk("far", { lat: northOf(BASE_LAT, 2_000), minute: 3 });
    const r = runSTDBSCANDetailed([...cluster, tooLate, tooFar]);
    expect(r.clusters).toHaveLength(1);
    expect(r.clusters[0]!.reportIds).toEqual(["C-1", "C-2", "C-3", "C-4", "C-5"]);
    expect(r.unclusteredReportIds).toEqual(["far", "late"]);
  });

  it("chains reports through neighbourhood expansion (density-connected)", () => {
    // 5 reports, 400 m apart in a line, same time: ends are 1.6 km apart,
    // but each is linked to the next → one group of 5.
    const line = Array.from({ length: 5 }, (_, i) =>
      mk(`L-${i}`, { lat: northOf(BASE_LAT, i * 400), minute: i }),
    );
    const clusters = runSTDBSCAN(line);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]!.reportCount).toBe(5);
  });

  it("chains through time too: 0,10,20,30,40 min", () => {
    const reports = [0, 10, 20, 30, 40].map((m, i) => mk(`Q-${i}`, { minute: m }));
    expect(runSTDBSCAN(reports)).toHaveLength(1);
  });

  it("a border report (edge of a group) is adopted, not lost", () => {
    // 5 tight core reports plus one 480 m away that links to only one of them at the edge.
    const core = group("K", 5, { stepMinutes: 1 });
    const edge = mk("edge", { lat: northOf(BASE_LAT, 480), minute: 2 });
    const clusters = runSTDBSCAN([...core, edge]);
    expect(clusters[0]!.reportCount).toBe(6);
    expect(clusters[0]!.reportIds).toContain("edge");
  });

  it("strict DBSCAN mode (densityMinPoints = minReports) rejects thin chains", () => {
    const line = Array.from({ length: 5 }, (_, i) =>
      mk(`L-${i}`, { lat: northOf(BASE_LAT, i * 400), minute: i }),
    );
    // In a 400 m chain the middle report has 3 neighbours within 500 m (incl. itself) < 5.
    expect(runSTDBSCAN(line, { densityMinPoints: 5 })).toEqual([]);
  });
});

describe("output contents", () => {
  it("centroid is the mean position and severity/detectedAt/status are set", () => {
    const reports = [
      mk("a", { lat: 18.50, lon: 73.80, minute: 0, severity: "high" }),
      mk("b", { lat: 18.51, lon: 73.81, minute: 1, severity: "high" }),
      mk("c", { lat: 18.50, lon: 73.82, minute: 2, severity: "medium" }),
      mk("d", { lat: 18.51, lon: 73.80, minute: 3, severity: "high" }),
      mk("e", { lat: 18.50, lon: 73.81, minute: 4, severity: "high" }),
    ];
    // spread is ~2 km → use a bigger radius just for this test
    const [c] = runSTDBSCAN(reports, { spatialRadiusMeters: 3_000 });
    expect(c!.latitude).toBeCloseTo(18.504, 6);
    expect(c!.longitude).toBeCloseTo(73.808, 6);
    expect(c!.severity).toBe("high");
    expect(c!.status).toBe("validated");
    expect(c!.detectedAt).toBe("2026-07-14T09:04:00.000Z"); // when the 5th report arrived
    expect(c!.id).toBe("flooding-cluster-01");
  });

  it("does not mutate its input", () => {
    const reports = group("M", 6);
    const snapshot = JSON.stringify(reports);
    runSTDBSCAN(reports);
    expect(JSON.stringify(reports)).toBe(snapshot);
  });

  it("is deterministic and independent of input order", () => {
    const reports = [
      ...group("A", 6, { category: "pothole" }),
      ...group("B", 5, { category: "plastic", lat: northOf(BASE_LAT, 4_000) }),
      mk("noise", { lat: northOf(BASE_LAT, 9_000) }),
    ];
    const forward = runSTDBSCAN(reports);
    const backward = runSTDBSCAN([...reports].reverse());
    const shuffled = runSTDBSCAN([...reports].sort((x, y) => (x.id < y.id ? 1 : -1)));
    expect(backward).toEqual(forward);
    expect(shuffled).toEqual(forward);
    expect(runSTDBSCAN(reports)).toEqual(forward);
  });

  it("ignores invalid reports instead of crashing", () => {
    const bad: HazardReport[] = [
      { ...mk("nan"), latitude: NaN },
      { ...mk("lat"), latitude: 123 },
      { ...mk("time"), timestamp: "not a date" },
      mk("dup"), mk("dup"),
    ];
    const r = runSTDBSCANDetailed([...group("G", 5), ...bad]);
    expect(r.clusters).toHaveLength(1);
    // 5 group reports + the FIRST "dup" (valid); the second "dup" is rejected.
    expect(r.clusters[0]!.reportCount).toBe(6);
    expect(r.invalidReportIds.sort()).toEqual(["dup", "lat", "nan", "time"]);
  });

  it("rejects invalid options", () => {
    expect(() => runSTDBSCAN([], { spatialRadiusMeters: 0 })).toThrow(RangeError);
    expect(() => runSTDBSCAN([], { temporalWindowMinutes: -1 })).toThrow(RangeError);
    expect(() => runSTDBSCAN([], { minReports: 0 })).toThrow(RangeError);
    expect(() => runSTDBSCAN([], { minReports: 2.5 })).toThrow(RangeError);
  });

  it("custom options change behaviour", () => {
    const reports = group("X", 3);
    expect(runSTDBSCAN(reports)).toEqual([]);
    expect(runSTDBSCAN(reports, { minReports: 3 })).toHaveLength(1);
  });
});

describe("aggregateSeverity", () => {
  it("throws on empty", () => {
    expect(() => aggregateSeverity([])).toThrow();
  });
});
