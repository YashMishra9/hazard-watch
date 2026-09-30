/**
 * Public API of the clustering module.
 * UI / map / dashboard code should import ONLY from here.
 *
 *   import { runSTDBSCAN } from "@/lib/clustering";
 */
export { runSTDBSCAN, runSTDBSCANDetailed } from "./stdbscan";
export type { STDBSCANResult } from "./stdbscan";
export { DEFAULT_ST_DBSCAN_OPTIONS } from "./options";
export type { STDBSCANOptions, ResolvedSTDBSCANOptions } from "./options";
export { haversineDistanceMeters } from "./geo";
export { aggregateSeverity } from "./severity";
