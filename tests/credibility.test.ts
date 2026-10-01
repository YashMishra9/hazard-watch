import { describe, expect, it } from "vitest";
import type { HazardReport } from "../src/types/hazard";
import { assessUrgent, urgentInLastHour, MAX_URGENT_PER_HOUR } from "../src/lib/credibility";

const NOW = Date.parse("2026-10-01T10:00:00Z");
const r = (id: string, extra: Partial<HazardReport> = {}): HazardReport => ({
  id, latitude: 18.5204, longitude: 73.8567, timestamp: new Date(NOW).toISOString(), category: "flooding", severity: "high",
  needsResponse: true, deviceId: "dev_a", ...extra,
});
const full = { photoUrl: "data:x", locationSource: "gps" as const, locationAccuracyM: 12, description: "Water is rising fast near the bus stop" };

describe("assessUrgent", () => {
  it("a lone report from a new device never reaches high, even with a photo, GPS and description", () => {
    const a = assessUrgent(r("1", full), [r("1", full)]);
    expect(a.level).toBe("medium");
    expect(a.score).toBeLessThan(75);
  });
  it("a bare report with no evidence is low confidence", () => {
    expect(assessUrgent(r("1"), [r("1")]).level).toBe("low");
  });
  it("a second device nearby makes it high", () => {
    const first = r("1", full), second = r("2", { deviceId: "dev_b", latitude: 18.5206 });
    expect(assessUrgent(first, [first, second]).level).toBe("high");
  });
  it("same device twice does not count as corroboration", () => {
    const first = r("1", full), second = r("2", { latitude: 18.5206 });
    const a = assessUrgent(first, [first, second]);
    expect(a.reasons.join(" ")).not.toMatch(/other device/);
    expect(a.warnings.join(" ")).toMatch(/already reported the same spot/);
  });
  it("earlier false reports from the device lower the score", () => {
    const old = r("0", { timestamp: new Date(NOW - 86_400_000).toISOString() }), now = r("1", full);
    const clean = assessUrgent(now, [old, now]).score;
    const flagged = assessUrgent(now, [old, now], { "0": "false" });
    expect(flagged.score).toBeLessThan(clean);
    expect(flagged.warnings.join(" ")).toMatch(/marked false/);
  });
  it("confirmed history helps", () => {
    const old = r("0", { timestamp: new Date(NOW - 86_400_000).toISOString() }), now = r("1", full);
    expect(assessUrgent(now, [old, now], { "0": "confirmed" }).score).toBeGreaterThan(assessUrgent(now, [old, now]).score);
  });
  it("flags locations outside Pune", () => {
    const far = r("1", { ...full, latitude: 65, longitude: 42 });
    const a = assessUrgent(far, [far]);
    expect(a.warnings.join(" ")).toMatch(/outside the Pune/);
    expect(a.level).toBe("low");
  });
});

describe("urgentInLastHour", () => {
  it("counts only this device's urgent requests inside the hour", () => {
    const list = [r("1"), r("2", { timestamp: new Date(NOW - 30 * 60_000).toISOString() }), r("3", { timestamp: new Date(NOW - 2 * 3_600_000).toISOString() }), r("4", { deviceId: "dev_b" }), r("5", { needsResponse: false })];
    expect(urgentInLastHour(list, "dev_a", NOW)).toBe(2);
    expect(MAX_URGENT_PER_HOUR).toBe(2);
  });
});