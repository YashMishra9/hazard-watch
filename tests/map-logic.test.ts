import assert from "node:assert/strict";
import { it } from "vitest";
import type { HazardCluster, HazardReport } from "../src/types/hazard";
import { buildAlerts, countUnread, alertIdForCluster } from "../src/lib/alerts";
import { clusterRadiusMeters, getContributingReports, haversineMeters, indexReports, pointsForCluster } from "../src/lib/geo";
import { formatCoords, formatTimestamp } from "../src/lib/format";
import { fixtureClusters, fixtureReports } from "../src/dev/mapFixtures";

const t = it;

t("haversine: known distance Pune<->Mumbai ~120km", () => {
  const d = haversineMeters(18.5204, 73.8567, 19.076, 72.8777) / 1000;
  assert.ok(d > 115 && d < 125, String(d));
});
t("haversine: zero distance", () => assert.equal(haversineMeters(18.5, 73.8, 18.5, 73.8), 0));

const mk = (id: string, lat: number, lng: number): HazardReport => ({
  id, latitude: lat, longitude: lng, timestamp: "2026-09-30T05:00:00Z", category: "flooding", severity: "high",
});
const cl = (over: Partial<HazardCluster> = {}): HazardCluster => ({
  id: "c1", category: "flooding", latitude: 18.53, longitude: 73.85, reportCount: 2, severity: "high",
  reportIds: ["a", "b", "missing"], detectedAt: "2026-09-30T05:10:00Z", status: "validated", ...over,
});

t("contributing reports skips ids not loaded", () => {
  const by = indexReports([mk("a", 18.53, 73.85), mk("b", 18.531, 73.851)]);
  assert.deepEqual(getContributingReports(cl(), by).map((r) => r.id), ["a", "b"]);
});
t("radius: covers farthest member + padding, min 120m", () => {
  const by = indexReports([mk("a", 18.53, 73.85), mk("b", 18.5318, 73.85)]); // ~200m north
  const r = clusterRadiusMeters(cl(), by);
  assert.ok(r >= 250 && r <= 270, String(r));
  assert.equal(clusterRadiusMeters(cl({ reportIds: ["a"] }), indexReports([mk("a", 18.53, 73.85)])), 120);
});
t("radius: fallback when no members loaded", () => assert.equal(clusterRadiusMeters(cl(), new Map()), 300));
t("pointsForCluster includes centroid first", () => {
  const pts = pointsForCluster(cl(), indexReports([mk("a", 18.5, 73.8)]));
  assert.deepEqual(pts[0], [18.53, 73.85]); assert.equal(pts.length, 2);
});

t("alerts: one per cluster, sorted severity>recency>count", () => {
  const cs = [
    cl({ id: "low-new", severity: "low", detectedAt: "2026-09-30T09:00:00Z" }),
    cl({ id: "high-old", severity: "high", detectedAt: "2026-09-30T01:00:00Z" }),
    cl({ id: "high-new", severity: "high", detectedAt: "2026-09-30T08:00:00Z" }),
    cl({ id: "med", severity: "medium" }),
  ];
  assert.deepEqual(buildAlerts(cs, new Set()).map((a) => a.clusterId), ["high-new", "high-old", "med", "low-new"]);
});
t("alerts: read state keyed by alert id; unread count", () => {
  const cs = [cl({ id: "x" }), cl({ id: "y" })];
  const a = buildAlerts(cs, new Set([alertIdForCluster("x")]));
  assert.equal(countUnread(a), 1);
  assert.equal(a.find((z) => z.clusterId === "x")!.read, true);
});
t("alerts: empty input -> empty", () => assert.deepEqual(buildAlerts([], new Set()), []));
t("alerts: createdAt is the detection time", () => {
  assert.equal(buildAlerts([cl()], new Set())[0].createdAt, "2026-09-30T05:10:00Z");
});

t("format: IST timestamp", () => assert.match(formatTimestamp("2026-09-30T08:45:00Z"), /30 Sep\w* 2026, 02:15 pm/i));
t("format: bad timestamp falls back to raw", () => assert.equal(formatTimestamp("nope"), "nope"));
t("format: coords", () => assert.equal(formatCoords(18.5204, 73.8567), "18.5204° N, 73.8567° E"));

t("fixtures: every cluster's reportIds exist & counts match", () => {
  const by = indexReports(fixtureReports);
  for (const c of fixtureClusters) {
    assert.equal(c.reportIds.length, c.reportCount);
    assert.equal(getContributingReports(c, by).length, c.reportCount);
    assert.equal(c.status, "validated");
  }
  assert.equal(new Set(fixtureReports.map((r) => r.id)).size, fixtureReports.length);
});
t("fixtures: members lie within computed radius of centroid", () => {
  const by = indexReports(fixtureReports);
  for (const c of fixtureClusters) {
    const r = clusterRadiusMeters(c, by);
    for (const m of getContributingReports(c, by)) assert.ok(haversineMeters(c.latitude, c.longitude, m.latitude, m.longitude) <= r);
  }
});
t("fixtures: all points inside Pune area", () => {
  for (const r of fixtureReports) assert.ok(r.latitude > 18.4 && r.latitude < 18.7 && r.longitude > 73.7 && r.longitude < 74.0, r.id);
});

