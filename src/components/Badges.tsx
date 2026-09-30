import type { HazardCategory, Severity } from "@/types/hazard";
import { categoryMeta, severityMeta } from "@/lib/constants";

export function CategoryBadge({ category }: { category: HazardCategory }) {
  const m = categoryMeta(category);
  const Icon = m.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${m.chip}`}><Icon size={12} />{m.label}</span>;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const m = severityMeta(severity);
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${m.chip}`}>{m.label}</span>;
}
