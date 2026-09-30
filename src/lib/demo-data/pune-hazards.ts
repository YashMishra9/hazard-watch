/**
 * Deterministic demo dataset: simulated citizen hazard reports around Pune.
 *
 * NO randomness. Every report is produced from a fixed table of offsets
 * (metres east/north of a landmark, minutes after a start time), so the
 * dataset is identical on every run. Clusters are NOT stored here — these
 * are only raw reports; runSTDBSCAN() has to discover the hotspots.
 *
 * Landmark coordinates are approximate. Reports are simulated.
 */
import type {
  HazardCategory,
  HazardReport,
  Severity,
} from "../../types/hazard";

const L: Severity = "low";
const M: Severity = "medium";
const H: Severity = "high";

/** [metres east, metres north, minutes after start, severity] */
type Row = readonly [number, number, number, Severity];

interface Spot {
  /** Why this group exists (documentation only). */
  purpose: string;
  place: string;
  category: HazardCategory;
  latitude: number;
  longitude: number;
  /** Start time, UTC. (Pune is UTC+05:30.) */
  start: string;
  rows: readonly Row[];
  note: string;
}

const METERS_PER_DEGREE_LAT = 111_320;
const round6 = (v: number) => Math.round(v * 1e6) / 1e6;

const ID_PREFIX: Record<HazardCategory, string> = {
  flooding: "FLD",
  pothole: "PTH",
  ewaste: "EWS",
  plastic: "PLS",
};

const SPOTS: readonly Spot[] = [
  /* ===== Groups that SHOULD become validated clusters ===== */
  {
    purpose: "validated",
    place: "Dandekar Bridge",
    category: "flooding",
    latitude: 18.4995, longitude: 73.8432,
    start: "2026-07-14T09:00:00.000Z",
    note: "Water-logging near Dandekar Bridge",
    rows: [[0, 0, 0, H], [40, -25, 3, H], [-60, 30, 6, H], [90, 60, 9, M],
           [-110, -40, 12, H], [30, 120, 16, M], [-20, -90, 21, H]],
  },
  {
    purpose: "validated (exactly 5, mixed severity)",
    place: "Karve Road, Kothrud",
    category: "flooding",
    latitude: 18.5074, longitude: 73.8077,
    start: "2026-07-14T09:20:00.000Z",
    note: "Flooded stretch on Karve Road",
    rows: [[0, 0, 0, M], [35, 20, 3, L], [-45, 10, 7, M], [60, -30, 10, M], [-20, 50, 14, H]],
  },
  {
    purpose: "validated (severity tie -> rounds up to high)",
    place: "Katraj-Kondhwa Road",
    category: "pothole",
    latitude: 18.4575, longitude: 73.8677,
    start: "2026-07-14T07:30:00.000Z",
    note: "Deep potholes on Katraj-Kondhwa Road",
    rows: [[0, 0, 0, H], [50, 30, 4, M], [-70, 20, 8, H], [100, -60, 12, M],
           [-30, -80, 15, H], [80, 90, 22, M]],
  },
  {
    purpose: "validated (exactly 5, low severity)",
    place: "Hinjewadi Phase 1",
    category: "pothole",
    latitude: 18.5912, longitude: 73.7389,
    start: "2026-07-14T11:00:00.000Z",
    note: "Potholes near Hinjewadi Phase 1 junction",
    rows: [[0, 0, 0, L], [45, -20, 5, L], [-30, 40, 9, M], [70, 25, 14, L], [-55, -35, 20, M]],
  },
  {
    purpose: "validated (exactly 5)",
    place: "FC Road",
    category: "ewaste",
    latitude: 18.5236, longitude: 73.8410,
    start: "2026-07-14T12:10:00.000Z",
    note: "Dumped electronics near FC Road",
    rows: [[0, 0, 0, L], [30, 40, 5, M], [-40, 15, 11, M], [55, -30, 18, L], [-15, -60, 25, M]],
  },
  {
    purpose: "validated (largest cluster, includes an edge report)",
    place: "Hadapsar",
    category: "plastic",
    latitude: 18.5089, longitude: 73.9260,
    start: "2026-07-14T10:00:00.000Z",
    note: "Plastic waste dump in Hadapsar",
    rows: [[0, 0, 0, M], [60, 40, 3, H], [-80, 25, 6, M], [110, -50, 9, H],
           [-40, -90, 13, L], [20, 130, 17, H], [-130, 60, 22, L], [420, 20, 27, M]],
  },
  {
    purpose: "validated",
    place: "Pune Railway Station",
    category: "plastic",
    latitude: 18.5286, longitude: 73.8743,
    start: "2026-07-14T15:00:00.000Z",
    note: "Plastic waste near Pune station",
    rows: [[0, 0, 0, H], [70, -40, 2, H], [-50, 60, 5, M], [100, 80, 9, H],
           [-90, -70, 12, H], [20, -120, 18, M]],
  },

  /* ===== Groups that must FAIL the criteria (deliberately) ===== */
  {
    purpose: "fails: 5 reports but each ~900 m apart (spatial)",
    place: "Wakad",
    category: "pothole",
    latitude: 18.5990, longitude: 73.7600,
    start: "2026-07-14T13:00:00.000Z",
    note: "Pothole along a long road, far from other reports",
    rows: [[0, 0, 0, M], [900, 0, 3, H], [1800, 0, 6, L], [2700, 0, 9, M], [3600, 0, 12, H]],
  },
  {
    purpose: "fails: 5 reports at one spot but 45 min apart (temporal)",
    place: "Viman Nagar",
    category: "flooding",
    latitude: 18.5679, longitude: 73.9143,
    start: "2026-07-14T08:00:00.000Z",
    note: "Recurring puddle reported hours apart",
    rows: [[0, 0, 0, H], [10, 5, 45, H], [-8, 12, 90, M], [5, -10, 135, H], [-12, -6, 180, M]],
  },
  {
    purpose: "fails: only 4 reports (below N=5), same spot & time as Karve Rd flooding",
    place: "Karve Road, Kothrud (plastic)",
    category: "plastic",
    latitude: 18.5074, longitude: 73.8077,
    start: "2026-07-14T09:20:00.000Z",
    note: "Plastic litter at the flooded stretch",
    rows: [[5, 5, 0, M], [-10, 8, 2, M], [12, -6, 5, L], [-4, -12, 8, M]],
  },
  {
    purpose: "fails: 3 potholes + 3 plastic + 2 e-waste co-located; no category reaches 5",
    place: "Swargate (pothole)",
    category: "pothole",
    latitude: 18.5018, longitude: 73.8636,
    start: "2026-07-14T14:00:00.000Z",
    note: "Pothole at Swargate junction",
    rows: [[0, 0, 0, M], [15, 10, 3, M], [-10, 12, 6, H]],
  },
  {
    purpose: "fails: (see above)",
    place: "Swargate (plastic)",
    category: "plastic",
    latitude: 18.5018, longitude: 73.8636,
    start: "2026-07-14T14:00:00.000Z",
    note: "Plastic waste at Swargate junction",
    rows: [[8, -6, 1, M], [-12, 4, 4, L], [10, 14, 7, M]],
  },
  {
    purpose: "fails: (see above)",
    place: "Swargate (e-waste)",
    category: "ewaste",
    latitude: 18.5018, longitude: 73.8636,
    start: "2026-07-14T14:00:00.000Z",
    note: "Dumped electronics at Swargate junction",
    rows: [[-5, -8, 2, L], [14, 3, 5, M]],
  },
  {
    purpose: "noise: right place, but 90+ min after the Dandekar Bridge cluster",
    place: "Dandekar Bridge (late)",
    category: "flooding",
    latitude: 18.4995, longitude: 73.8432,
    start: "2026-07-14T11:30:00.000Z",
    note: "Late report at Dandekar Bridge",
    rows: [[10, 10, 0, M]],
  },
  {
    purpose: "noise: right time, but 1.5 km from the Katraj-Kondhwa cluster",
    place: "Katraj-Kondhwa (far)",
    category: "pothole",
    latitude: 18.4575, longitude: 73.8677,
    start: "2026-07-14T07:40:00.000Z",
    note: "Pothole 1.5 km east of the cluster",
    rows: [[1500, 0, 0, M]],
  },
  {
    purpose: "noise: right place, but 43 min after the last Hadapsar report",
    place: "Hadapsar (late)",
    category: "plastic",
    latitude: 18.5089, longitude: 73.9260,
    start: "2026-07-14T11:10:00.000Z",
    note: "Late plastic report in Hadapsar",
    rows: [[0, 0, 0, H]],
  },

  /* ===== Isolated noise across the city (one report each) ===== */
  { purpose: "noise", place: "Aundh", category: "flooding", latitude: 18.5580, longitude: 73.8078, start: "2026-07-14T06:45:00.000Z", note: "Isolated flooding report in Aundh", rows: [[0, 0, 0, L]] },
  { purpose: "noise", place: "Pashan", category: "pothole", latitude: 18.5350, longitude: 73.7900, start: "2026-07-14T07:10:00.000Z", note: "Isolated pothole report in Pashan", rows: [[0, 0, 0, M]] },
  { purpose: "noise", place: "Kharadi", category: "ewaste", latitude: 18.5514, longitude: 73.9407, start: "2026-07-14T12:20:00.000Z", note: "Isolated e-waste report in Kharadi", rows: [[0, 0, 0, L]] },
  { purpose: "noise", place: "Kondhwa", category: "plastic", latitude: 18.4700, longitude: 73.8900, start: "2026-07-14T10:15:00.000Z", note: "Isolated plastic report in Kondhwa", rows: [[0, 0, 0, M]] },
  { purpose: "noise", place: "Baner", category: "pothole", latitude: 18.5590, longitude: 73.7868, start: "2026-07-14T11:05:00.000Z", note: "Isolated pothole report in Baner", rows: [[0, 0, 0, H]] },
  { purpose: "noise", place: "Magarpatta", category: "flooding", latitude: 18.5150, longitude: 73.9270, start: "2026-07-14T09:05:00.000Z", note: "Isolated flooding report in Magarpatta", rows: [[0, 0, 0, M]] },
  { purpose: "noise", place: "Sinhagad Road", category: "ewaste", latitude: 18.4700, longitude: 73.8100, start: "2026-07-14T16:10:00.000Z", note: "Isolated e-waste report on Sinhagad Road", rows: [[0, 0, 0, L]] },
  { purpose: "noise", place: "Camp", category: "plastic", latitude: 18.5150, longitude: 73.8780, start: "2026-07-14T15:05:00.000Z", note: "Isolated plastic report in Camp", rows: [[0, 0, 0, L]] },
];

/** Convert the offset tables into HazardReport[] (sorted like an incoming feed). */
function buildReports(): HazardReport[] {
  const counters: Record<HazardCategory, number> = {
    flooding: 0, pothole: 0, ewaste: 0, plastic: 0,
  };
  const reports: HazardReport[] = [];

  for (const spot of SPOTS) {
    const startMs = Date.parse(spot.start);
    const metersPerDegLon =
      METERS_PER_DEGREE_LAT * Math.cos((spot.latitude * Math.PI) / 180);

    for (const [east, north, minutes, severity] of spot.rows) {
      counters[spot.category] += 1;
      const n = String(counters[spot.category]).padStart(3, "0");
      reports.push({
        id: `${ID_PREFIX[spot.category]}-${n}`,
        latitude: round6(spot.latitude + north / METERS_PER_DEGREE_LAT),
        longitude: round6(spot.longitude + east / metersPerDegLon),
        timestamp: new Date(startMs + minutes * 60_000).toISOString(),
        category: spot.category,
        severity,
        description: spot.note,
      });
    }
  }

  return reports.sort(
    (a, b) =>
      Date.parse(a.timestamp) - Date.parse(b.timestamp) ||
      (a.id < b.id ? -1 : 1),
  );
}

/** The demo dataset (75 reports). Treat as read-only; use getPuneDemoReports() for a copy. */
export const PUNE_DEMO_REPORTS: readonly HazardReport[] = Object.freeze(buildReports());

/** A fresh, mutable copy of the demo dataset. */
export function getPuneDemoReports(): HazardReport[] {
  return PUNE_DEMO_REPORTS.map((r) => ({ ...r }));
}

/** Human-readable description of each demo group (for docs / viva). */
export const PUNE_DEMO_GROUPS: readonly { place: string; category: HazardCategory; reports: number; purpose: string }[] =
  SPOTS.map((s) => ({ place: s.place, category: s.category, reports: s.rows.length, purpose: s.purpose }));
