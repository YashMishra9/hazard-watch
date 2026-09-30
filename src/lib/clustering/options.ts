/**
 * Configuration for ST-DBSCAN.
 */
export interface STDBSCANOptions {
  /** ε₁ — max distance (metres) between two linked reports. Default 500. */
  spatialRadiusMeters?: number;
  /** ε₂ — max time gap (minutes) between two linked reports. Default 30. */
  temporalWindowMinutes?: number;
  /** N — minimum reports in a group for it to become "validated". Default 5. */
  minReports?: number;
  /**
   * DBSCAN "MinPts" used while growing a group: a report is a *core* report
   * (it may pull its neighbours in) if its neighbourhood, counting itself,
   * has at least this many reports. Default 2, i.e. "linked to at least one
   * other report", which matches the prototype methodology (link reports,
   * form connected groups, then apply the count threshold N).
   * Set it equal to `minReports` for the stricter textbook DBSCAN.
   */
  densityMinPoints?: number;
}

export type ResolvedSTDBSCANOptions = Required<STDBSCANOptions>;

export const DEFAULT_ST_DBSCAN_OPTIONS: Readonly<ResolvedSTDBSCANOptions> =
  Object.freeze({
    spatialRadiusMeters: 500,
    temporalWindowMinutes: 30,
    minReports: 5,
    densityMinPoints: 2,
  });

/** Merge user options over the defaults and validate them. */
export function resolveOptions(
  options?: STDBSCANOptions,
): ResolvedSTDBSCANOptions {
  const resolved: ResolvedSTDBSCANOptions = {
    ...DEFAULT_ST_DBSCAN_OPTIONS,
    ...stripUndefined(options),
  };

  if (!Number.isFinite(resolved.spatialRadiusMeters) || resolved.spatialRadiusMeters <= 0) {
    throw new RangeError("spatialRadiusMeters must be a positive number");
  }
  if (!Number.isFinite(resolved.temporalWindowMinutes) || resolved.temporalWindowMinutes < 0) {
    throw new RangeError("temporalWindowMinutes must be a number ≥ 0");
  }
  if (!Number.isInteger(resolved.minReports) || resolved.minReports < 1) {
    throw new RangeError("minReports must be an integer ≥ 1");
  }
  if (!Number.isInteger(resolved.densityMinPoints) || resolved.densityMinPoints < 1) {
    throw new RangeError("densityMinPoints must be an integer ≥ 1");
  }
  return resolved;
}

function stripUndefined(options?: STDBSCANOptions): STDBSCANOptions {
  const out: STDBSCANOptions = {};
  if (!options) return out;
  for (const key of Object.keys(options) as (keyof STDBSCANOptions)[]) {
    if (options[key] !== undefined) out[key] = options[key];
  }
  return out;
}
