import type { HazardCategory, Severity } from "@/types/hazard";

/** Pune city centre (Shivajinagar area). */
export const PUNE_CENTER: [number, number] = [18.5204, 73.8567];
export const PUNE_ZOOM = 12;

export const OSM_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const CATEGORIES: HazardCategory[] = ["flooding", "pothole", "ewaste", "plastic"];
export const SEVERITIES: Severity[] = ["low", "medium", "high"];

/** Category is encoded by fill colour (and icon in UI text). */
export const CATEGORY_META: Record<HazardCategory, { label: string; color: string }> = {
  flooding: { label: "Flooding", color: "#2563eb" },
  pothole: { label: "Pothole", color: "#7c2d12" },
  ewaste: { label: "E-waste", color: "#7c3aed" },
  plastic: { label: "Plastic waste", color: "#0d9488" },
};

/** Severity is encoded by ring colour on hotspots and by badges everywhere. */
export const SEVERITY_META: Record<Severity, { label: string; color: string; rank: number }> = {
  low: { label: "Low", color: "#eab308", rank: 1 },
  medium: { label: "Medium", color: "#f97316", rank: 2 },
  high: { label: "High", color: "#dc2626", rank: 3 },
};
