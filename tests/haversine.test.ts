import { describe, it, expect } from "vitest";
import { haversineDistanceMeters, centroid } from "../src/lib/clustering/geo";

describe("haversineDistanceMeters", () => {
  it("is 0 for identical points", () => {
    const p = { latitude: 18.52, longitude: 73.85 };
    expect(haversineDistanceMeters(p, p)).toBe(0);
  });

  it("1 degree of latitude ≈ 111.195 km", () => {
    const d = haversineDistanceMeters(
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
    );
    expect(Math.abs(d - 111_194.93)).toBeLessThan(1);
  });

  it("Pune Station → Shaniwar Wada is roughly 3 km", () => {
    const d = haversineDistanceMeters(
      { latitude: 18.5286, longitude: 73.8743 },
      { latitude: 18.5195, longitude: 73.8553 },
    );
    expect(d).toBeGreaterThan(2_000);
    expect(d).toBeLessThan(2_400);
  });

  it("is symmetric", () => {
    const a = { latitude: 18.5, longitude: 73.8 };
    const b = { latitude: 18.6, longitude: 73.95 };
    expect(haversineDistanceMeters(a, b)).toBeCloseTo(haversineDistanceMeters(b, a), 9);
  });

  it("longitude degrees shrink with latitude", () => {
    const eq = haversineDistanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 });
    const pune = haversineDistanceMeters({ latitude: 18.5, longitude: 73 }, { latitude: 18.5, longitude: 74 });
    expect(pune).toBeLessThan(eq);
    expect(pune / eq).toBeCloseTo(Math.cos((18.5 * Math.PI) / 180), 2);
  });
});

describe("centroid", () => {
  it("averages latitude and longitude", () => {
    expect(
      centroid([
        { latitude: 18, longitude: 73 },
        { latitude: 20, longitude: 75 },
      ]),
    ).toEqual({ latitude: 19, longitude: 74 });
  });
  it("throws on empty input", () => {
    expect(() => centroid([])).toThrow();
  });
});
