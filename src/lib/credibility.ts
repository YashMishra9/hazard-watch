import type { HazardReport } from "@/types/hazard";
import { haversineMeters } from "./geo";

export const MAX_URGENT_PER_HOUR = 2;
/** Reports from outside this box are flagged. Adjust when you add more cities. */
export const SERVICE_AREA = { minLat: 18.4, maxLat: 18.65, minLng: 73.7, maxLng: 74.0 };

const HOUR = 3_600_000;
const MIN = 60_000;

export type Outcome = "confirmed" | "false";
export type CredibilityLevel = "high" | "medium" | "low";

export interface Assessment {
  score: number;
  level: CredibilityLevel;
  label: string;
  /** Things that raise confidence. */
  reasons: string[];
  /** Things that lower it, or are simply missing. */
  warnings: string[];
}

/** How many urgent requests this device sent in the hour before `now`. */
export function urgentInLastHour(reports: readonly HazardReport[], deviceId: string, now = Date.now()): number {
  return reports.filter((r) => r.needsResponse && r.deviceId === deviceId && now - Date.parse(r.timestamp) <= HOUR).length;
}

/**
 * A triage aid for the person on duty, never proof. A lone report from a new device tops out at "medium";
 * reaching "high" needs a second device nearby or a track record of confirmed reports.
 * `outcomes` maps report id -> what the authority decided (confirmed / false) for earlier urgent requests.
 */
export function assessUrgent(
  report: HazardReport,
  reports: readonly HazardReport[],
  outcomes: Readonly<Record<string, Outcome>> = {},
): Assessment {
  let score = 30;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const t = Date.parse(report.timestamp);

  if (report.photoUrl) { score += 20; reasons.push("Includes a photo."); } else warnings.push("No photo.");

  if (report.locationSource === "gps") {
    const acc = report.locationAccuracyM;
    if (acc !== undefined && acc <= 50) { score += 15; reasons.push(`GPS location, accurate to about ${acc} m.`); }
    else { score += 8; reasons.push(`GPS location${acc !== undefined ? `, accurate to about ${acc} m` : ""}.`); }
  } else warnings.push("Location was typed by hand, not taken from GPS.");

  if ((report.description?.trim().length ?? 0) >= 20) { score += 5; reasons.push("Describes what was seen."); }

  const others = reports.filter((o) => o.id !== report.id && o.deviceId && o.deviceId === report.deviceId);
  const witnesses = new Set(
    reports
      .filter((o) =>
        o.id !== report.id && o.deviceId && o.deviceId !== report.deviceId && o.category === report.category &&
        Math.abs(Date.parse(o.timestamp) - t) <= 60 * MIN &&
        haversineMeters(o.latitude, o.longitude, report.latitude, report.longitude) <= 500)
      .map((o) => o.deviceId),
  ).size;
  if (witnesses >= 1) {
    score += witnesses >= 2 ? 35 : 25;
    reasons.push(`${witnesses} other ${witnesses === 1 ? "device" : "devices"} reported the same hazard nearby.`);
  } else warnings.push("No other device has reported this yet.");

  const confirmed = others.filter((o) => outcomes[o.id] === "confirmed").length;
  const falses = others.filter((o) => outcomes[o.id] === "false").length;
  if (falses > 0) { score -= 40 * Math.min(falses, 2); warnings.push(`${falses} earlier ${falses === 1 ? "report" : "reports"} from this device ${falses === 1 ? "was" : "were"} marked false.`); }
  else if (confirmed > 0) { score += 10; reasons.push("Earlier reports from this device were confirmed."); }

  const a = SERVICE_AREA;
  if (report.latitude < a.minLat || report.latitude > a.maxLat || report.longitude < a.minLng || report.longitude > a.maxLng) {
    score -= 40; warnings.push("Location is outside the Pune service area.");
  }

  if (others.some((o) => o.category === report.category && Math.abs(Date.parse(o.timestamp) - t) <= 30 * MIN &&
      haversineMeters(o.latitude, o.longitude, report.latitude, report.longitude) <= 100)) {
    score -= 15; warnings.push("This device already reported the same spot a moment ago.");
  }

  if (report.deviceId && urgentInLastHour(reports, report.deviceId, t) > MAX_URGENT_PER_HOUR) {
    score -= 25; warnings.push("This device sent many urgent requests within an hour.");
  }

  score = Math.max(0, Math.min(100, score));
  const level: CredibilityLevel = score >= 75 ? "high" : score >= 45 ? "medium" : "low";
  const label = level === "high" ? "Likely genuine" : level === "medium" ? "Needs a check" : "Low confidence";
  return { score, level, label, reasons, warnings };
}