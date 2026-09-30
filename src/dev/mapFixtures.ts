/**
 * STATIC VISUAL FIXTURES for /map-preview only.
 *
 * These are NOT produced by ST-DBSCAN and are NOT used by /monitor. Clusters here
 * are declared from known seed locations purely so the map can be exercised
 * without Developer 2's module. No clustering is performed in this file.
 */
import type { HazardCategory, HazardCluster, HazardReport, Severity } from "@/types/hazard";

// Small deterministic PRNG so the fixture is identical on every load.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

interface Seed {
  key: string;
  category: HazardCategory;
  severity: Severity;
  lat: number;
  lng: number;
  count: number;
  note: string;
}

const SEEDS: Seed[] = [
  { key: "A", category: "flooding", severity: "high", lat: 18.5308, lng: 73.8475, count: 8, note: "Water logging on road" },
  { key: "B", category: "pothole", severity: "medium", lat: 18.5074, lng: 73.8077, count: 6, note: "Deep potholes near junction" },
  { key: "C", category: "ewaste", severity: "low", lat: 18.5642, lng: 73.7769, count: 5, note: "Discarded electronics dumped" },
  { key: "D", category: "plastic", severity: "high", lat: 18.4967, lng: 73.9417, count: 7, note: "Plastic waste pile-up" },
];

const BASE = Date.parse("2026-09-30T08:00:00+05:30");
const iso = (minutesFromBase: number) => new Date(BASE + minutesFromBase * 60_000).toISOString();

const M_PER_DEG_LAT = 111_320;

export const fixtureReports: HazardReport[] = [];
export const fixtureClusters: HazardCluster[] = [];

SEEDS.forEach((seed, si) => {
  const rand = rng(1000 + si);
  const ids: string[] = [];
  for (let i = 0; i < seed.count; i++) {
    const id = `RPT-${seed.key}${String(i + 1).padStart(2, "0")}`;
    const r = 60 + rand() * 220; // metres from seed
    const theta = rand() * Math.PI * 2;
    fixtureReports.push({
      id,
      category: seed.category,
      severity: seed.severity,
      latitude: seed.lat + (r * Math.sin(theta)) / M_PER_DEG_LAT,
      longitude: seed.lng + (r * Math.cos(theta)) / (M_PER_DEG_LAT * Math.cos((seed.lat * Math.PI) / 180)),
      timestamp: iso(si * 20 + i * 4),
      description: seed.note,
    });
    ids.push(id);
  }
  fixtureClusters.push({
    id: `CL-${seed.key}`,
    category: seed.category,
    severity: seed.severity,
    latitude: seed.lat,
    longitude: seed.lng,
    reportCount: seed.count,
    reportIds: ids,
    detectedAt: iso(si * 20 + seed.count * 4 + 5),
    status: "validated",
  });
});

// Isolated single reports (what noise looks like on the map).
const noise = rng(42);
const NOISE_CATEGORIES: HazardCategory[] = ["flooding", "pothole", "ewaste", "plastic"];
for (let i = 0; i < 10; i++) {
  fixtureReports.push({
    id: `RPT-N${String(i + 1).padStart(2, "0")}`,
    category: NOISE_CATEGORIES[i % 4],
    severity: (["low", "medium", "high"] as Severity[])[i % 3],
    latitude: 18.46 + noise() * 0.11,
    longitude: 73.78 + noise() * 0.16,
    timestamp: iso(i * 7),
    description: "Single unverified report",
  });
}
