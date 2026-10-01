import type { HazardCategory, Severity } from "@/types/hazard";

/** Pune city centre (Shivajinagar area). */
export const PUNE_CENTER: [number, number] = [18.5204, 73.8567];
export const PUNE_ZOOM = 12;

// Basemap choice. NEXT_PUBLIC_MAP_STYLE can be "light", "voyager" or "osm" (default: "light").
// CARTO styles need a free key (NEXT_PUBLIC_CARTO_KEY); "osm" and the no-key fallback use plain
// OpenStreetMap tiles.
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY?.trim();
const MAP_STYLE = (process.env.NEXT_PUBLIC_MAP_STYLE ?? "light").trim().toLowerCase();
const useCarto = !!CARTO_KEY && MAP_STYLE !== "osm";
const cartoStyle = MAP_STYLE === "voyager" ? "voyager" : "light_all";

export const OSM_TILE_URL = useCarto
  ? `https://{s}.basemaps.cartocdn.com/rastertiles/${cartoStyle}/{z}/{x}/{y}.png?key=${encodeURIComponent(CARTO_KEY!)}`
  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION = useCarto
  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
