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
