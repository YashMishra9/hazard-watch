export type HazardCategory =
  | "flooding"
  | "pothole"
  | "ewaste"
  | "plastic";

export type Severity = "low" | "medium" | "high";

export interface HazardReport {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  category: HazardCategory;
  severity: Severity;
  description?: string;
    photoUrl?: string;
  /** Reporter asked the authorities to send a team (only offered for dangerous hazards). */
    needsResponse?: boolean;
  /** Anonymous per-browser id, used for rate limits and spotting repeat false reports. */
  deviceId?: string;
  locationSource?: "gps" | "manual";
  /** GPS accuracy in metres, when locationSource is "gps". */
  locationAccuracyM?: number;
}

export interface HazardCluster {
  id: string;
  category: HazardCategory;
  latitude: number;
  longitude: number;
  reportCount: number;
  severity: Severity;
  reportIds: string[];
  detectedAt: string;
  status: "validated";
}
