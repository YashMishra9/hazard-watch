import { Cpu, Construction, Recycle, ShieldCheck, Waves, type LucideIcon } from "lucide-react";
import type { HazardCategory, Severity } from "@/types/hazard";
import { CATEGORY_META, SEVERITY_META } from "@/components/map/mapConfig";

export const CATEGORY_ICONS: Record<HazardCategory, LucideIcon> = {
  flooding: Waves,
  pothole: Construction,
  ewaste: Cpu,
  plastic: Recycle,
};

export function CategoryBadge({ category, className = "" }: { category: HazardCategory; className?: string }) {
  const { label, color } = CATEGORY_META[category];
  const Icon = CATEGORY_ICONS[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${className}`}
      style={{ backgroundColor: color }}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

export function SeverityBadge({ severity, className = "" }: { severity: Severity; className?: string }) {
  const { label, color } = SEVERITY_META[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-800 ${className}`}
      style={{ borderColor: color }}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}

export function StatusBadge({ status, className = "" }: { status: "validated"; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 ${className}`}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
