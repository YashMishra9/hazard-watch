import { Construction, Cpu, Droplets, Recycle, type LucideIcon } from "lucide-react";
import type { HazardCategory, Severity } from "@/types/hazard";

export const CATEGORIES: { value: HazardCategory; label: string; hint: string; icon: LucideIcon; chip: string; bar: string }[] = [
  { value: "flooding", label: "Flooding", hint: "Waterlogging, blocked drains", icon: Droplets, chip: "bg-sky-100 text-sky-800", bar: "bg-sky-600" },
  { value: "pothole", label: "Pothole", hint: "Damaged road surface", icon: Construction, chip: "bg-orange-100 text-orange-800", bar: "bg-orange-600" },
  { value: "ewaste", label: "E-waste", hint: "Dumped electronics", icon: Cpu, chip: "bg-violet-100 text-violet-800", bar: "bg-violet-600" },
  { value: "plastic", label: "Plastic", hint: "Plastic dumping or burning", icon: Recycle, chip: "bg-emerald-100 text-emerald-800", bar: "bg-emerald-600" },
];

export const SEVERITIES: { value: Severity; label: string; rank: number; chip: string; bar: string }[] = [
  { value: "low", label: "Low", rank: 1, chip: "bg-emerald-100 text-emerald-800", bar: "bg-emerald-500" },
  { value: "medium", label: "Medium", rank: 2, chip: "bg-amber-100 text-amber-900", bar: "bg-amber-500" },
  { value: "high", label: "High", rank: 3, chip: "bg-rose-100 text-rose-800", bar: "bg-rose-600" },
];

export const categoryMeta = (c: HazardCategory) => CATEGORIES.find((x) => x.value === c)!;
export const severityMeta = (s: Severity) => SEVERITIES.find((x) => x.value === s)!;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
