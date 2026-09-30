import type { Severity } from "../../types/hazard";

/** low = 1, medium = 2, high = 3 */
export const SEVERITY_SCORE: Readonly<Record<Severity, number>> = {
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Cluster severity = the average severity of its reports, rounded to the
 * nearest level, with exact ties rounding UP (the safer choice for alerts).
 *
 *   mean < 1.5        → "low"
 *   1.5 ≤ mean < 2.5  → "medium"
 *   mean ≥ 2.5        → "high"
 *
 * Integer arithmetic (sum·2 vs 3·n / 5·n) avoids floating-point surprises,
 * so the result is fully deterministic and independent of report order.
 */
export function aggregateSeverity(severities: readonly Severity[]): Severity {
  if (severities.length === 0) {
    throw new RangeError("aggregateSeverity() needs at least one severity");
  }
  let sum = 0;
  for (const s of severities) sum += SEVERITY_SCORE[s];
  const n = severities.length;

  if (sum * 2 < 3 * n) return "low";
  if (sum * 2 < 5 * n) return "medium";
  return "high";
}
