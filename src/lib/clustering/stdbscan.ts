/**
 * ST-DBSCAN for citizen hazard reports.
 *
 * Idea (Birant & Kut, 2007): DBSCAN with TWO neighbourhood thresholds —
 * one in space (ε₁) and one in time (ε₂). Two reports are neighbours when
 *
 *   1. they have the same category, AND
 *   2. haversine distance ≤ ε₁   (default 500 m), AND
 *   3. |time difference| ≤ ε₂    (default 30 min).
 *
 * Groups of neighbours are grown by expansion. A group with at least N
 * reports (default 5) is a VALIDATED hotspot; everything else is noise.
 *
 * Boundaries are inclusive: exactly 500 m and exactly 30 min still count.
 * This is a rule-based validation of a hotspot, not proof that a physical
 * hazard exists.
 *
 * Complexity: O(n²) per category — fine for thousands of reports.
 */
import type {
  HazardCategory,
  HazardCluster,
  HazardReport,
} from "../../types/hazard";
import { centroid, haversineDistanceMeters } from "./geo";
import {
  resolveOptions,
  type ResolvedSTDBSCANOptions,
  type STDBSCANOptions,
} from "./options";
import { aggregateSeverity } from "./severity";

/** A report plus its pre-parsed timestamp (parsed once, not per comparison). */
interface Point {
  report: HazardReport;
  timeMs: number;
}

export interface STDBSCANResult {
  clusters: HazardCluster[];
  /** Valid reports that ended up in no validated cluster (noise / too small). */
  unclusteredReportIds: string[];
  /** Reports ignored because of bad coordinates/timestamp or a duplicate id. */
  invalidReportIds: string[];
  options: ResolvedSTDBSCANOptions;
}

const MS_PER_MINUTE = 60_000;

/* ---------- Step 1: neighbourhood tests ---------- */

/** Spatial neighbourhood: within ε₁ metres (inclusive). */
export function isSpatialNeighbour(
  a: HazardReport,
  b: HazardReport,
  radiusMeters: number,
): boolean {
  return haversineDistanceMeters(a, b) <= radiusMeters;
}

/** Temporal neighbourhood: within ε₂ milliseconds (inclusive). */
export function isTemporalNeighbour(
  timeA: number,
  timeB: number,
  windowMs: number,
): boolean {
  return Math.abs(timeA - timeB) <= windowMs;
}

/* ---------- Step 2: validation of input ---------- */

function isUsable(report: HazardReport, timeMs: number): boolean {
  return (
    typeof report.id === "string" &&
    Number.isFinite(timeMs) &&
    Number.isFinite(report.latitude) &&
    Number.isFinite(report.longitude) &&
    report.latitude >= -90 &&
    report.latitude <= 90 &&
    report.longitude >= -180 &&
    report.longitude <= 180
  );
}

/** Deterministic ordering: by time, then by id. */
function byTimeThenId(a: Point, b: Point): number {
  if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
  return a.report.id < b.report.id ? -1 : a.report.id > b.report.id ? 1 : 0;
}

/* ---------- Step 3: the DBSCAN expansion (one category at a time) ---------- */

const UNVISITED = -2;
const NOISE = -1;

/**
 * Runs ST-DBSCAN on points that ALL share one category.
 * Returns groups of point indices (before the size-N validation).
 */
function expandGroups(
  points: readonly Point[],
  opts: ResolvedSTDBSCANOptions,
): Point[][] {
  const windowMs = opts.temporalWindowMinutes * MS_PER_MINUTE;
  const labels: number[] = new Array<number>(points.length).fill(UNVISITED);
  const groups: Point[][] = [];

  /** All points (including i itself) that are spatial AND temporal neighbours of i. */
  const regionQuery = (i: number): number[] => {
    const p = points[i]!;
    const neighbours: number[] = [];
    for (let j = 0; j < points.length; j++) {
      const q = points[j]!;
      if (
        isTemporalNeighbour(p.timeMs, q.timeMs, windowMs) &&
        isSpatialNeighbour(p.report, q.report, opts.spatialRadiusMeters)
      ) {
        neighbours.push(j);
      }
    }
    return neighbours;
  };

  for (let i = 0; i < points.length; i++) {
    if (labels[i] !== UNVISITED) continue;

    const neighbours = regionQuery(i);
    if (neighbours.length < opts.densityMinPoints) {
      labels[i] = NOISE; // may still be adopted later as a border point
      continue;
    }

    // i is a core report: start a new group and expand it.
    const groupId = groups.length;
    const members: Point[] = [points[i]!];
    groups.push(members);
    labels[i] = groupId;

    const queue = neighbours.filter((j) => j !== i);
    for (let head = 0; head < queue.length; head++) {
      const j = queue[head]!;

      if (labels[j] === NOISE) {
        // Border report: reachable from a core report but not core itself.
        labels[j] = groupId;
        members.push(points[j]!);
        continue;
      }
      if (labels[j] !== UNVISITED) continue; // already in a group

      labels[j] = groupId;
      members.push(points[j]!);

      const jNeighbours = regionQuery(j);
      if (jNeighbours.length >= opts.densityMinPoints) {
        for (const k of jNeighbours) {
          if (labels[k] === UNVISITED || labels[k] === NOISE) queue.push(k);
        }
      }
    }
  }
  return groups;
}

/* ---------- Step 4: turn a validated group into a HazardCluster ---------- */

interface DraftCluster {
  category: HazardCategory;
  members: Point[]; // sorted by time, then id
  detectedAtMs: number;
}

function makeDraft(
  category: HazardCategory,
  group: Point[],
  minReports: number,
): DraftCluster {
  const members = [...group].sort(byTimeThenId);
  // "Detected" = the moment the group first reached N reports,
  // i.e. the timestamp of its N-th earliest report.
  const detectedAtMs = members[minReports - 1]!.timeMs;
  return { category, members, detectedAtMs };
}

/* ---------- Public API ---------- */

/**
 * Like runSTDBSCAN but also reports which reports were left unclustered.
 * Useful for tests, debugging and the viva demo.
 */
export function runSTDBSCANDetailed(
  reports: readonly HazardReport[],
  options?: STDBSCANOptions,
): STDBSCANResult {
  const opts = resolveOptions(options);

  // Parse + validate. Input array and report objects are never mutated.
  const invalidReportIds: string[] = [];
  const seenIds = new Set<string>();
  const byCategory = new Map<HazardCategory, Point[]>();

  for (const report of reports) {
    const timeMs = Date.parse(report.timestamp);
    if (!isUsable(report, timeMs) || seenIds.has(report.id)) {
      invalidReportIds.push(report.id);
      continue;
    }
    seenIds.add(report.id);
    const list = byCategory.get(report.category) ?? [];
    list.push({ report, timeMs });
    byCategory.set(report.category, list);
  }

  // Category filtering: each category is clustered completely on its own.
  const drafts: DraftCluster[] = [];
  const clusteredIds = new Set<string>();

  for (const [category, pts] of byCategory) {
    const sorted = [...pts].sort(byTimeThenId);
    for (const group of expandGroups(sorted, opts)) {
      if (group.length < opts.minReports) continue; // too small: not validated
      const draft = makeDraft(category, group, opts.minReports);
      drafts.push(draft);
      for (const m of draft.members) clusteredIds.add(m.report.id);
    }
  }

  // Deterministic output order and IDs, independent of input order.
  drafts.sort(
    (a, b) =>
      a.detectedAtMs - b.detectedAtMs ||
      (a.category < b.category ? -1 : a.category > b.category ? 1 : 0) ||
      (a.members[0]!.report.id < b.members[0]!.report.id ? -1 : 1),
  );

  const perCategoryCount = new Map<HazardCategory, number>();
  const clusters: HazardCluster[] = drafts.map((d) => {
    const n = (perCategoryCount.get(d.category) ?? 0) + 1;
    perCategoryCount.set(d.category, n);

    const c = centroid(d.members.map((m) => m.report));
    return {
      id: `${d.category}-cluster-${String(n).padStart(2, "0")}`,
      category: d.category,
      latitude: c.latitude,
      longitude: c.longitude,
      reportCount: d.members.length,
      severity: aggregateSeverity(d.members.map((m) => m.report.severity)),
      reportIds: d.members.map((m) => m.report.id),
      detectedAt: new Date(d.detectedAtMs).toISOString(),
      status: "validated",
    };
  });

  const unclusteredReportIds: string[] = [];
  for (const pts of byCategory.values()) {
    for (const p of pts) {
      if (!clusteredIds.has(p.report.id)) unclusteredReportIds.push(p.report.id);
    }
  }
  unclusteredReportIds.sort();

  return { clusters, unclusteredReportIds, invalidReportIds, options: opts };
}

/**
 * MAIN ENTRY POINT.
 * Takes raw citizen reports, returns validated hazard clusters.
 */
export function runSTDBSCAN(
  reports: readonly HazardReport[],
  options?: STDBSCANOptions,
): HazardCluster[] {
  return runSTDBSCANDetailed(reports, options).clusters;
}
