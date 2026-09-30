import type { HazardCategory, Severity } from "@/types/hazard";
import { CATEGORIES, SEVERITIES } from "@/lib/constants";

export type SortKey = "newest" | "oldest" | "severity";
export interface Filters { category: HazardCategory | "all"; severity: Severity | "all"; sort: SortKey }

const sel = "rounded-lg border border-line bg-white px-3 py-2 text-sm";

export function ReportFilters({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <label className="sr-only" htmlFor="f-cat">Filter by category</label>
      <select id="f-cat" className={sel} value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value as Filters["category"] })}>
        <option value="all">All categories</option>
        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <label className="sr-only" htmlFor="f-sev">Filter by severity</label>
      <select id="f-sev" className={sel} value={value.severity} onChange={(e) => onChange({ ...value, severity: e.target.value as Filters["severity"] })}>
        <option value="all">All severities</option>
        {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <label className="sr-only" htmlFor="f-sort">Sort reports</label>
      <select id="f-sort" className={sel} value={value.sort} onChange={(e) => onChange({ ...value, sort: e.target.value as SortKey })}>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="severity">Highest severity</option>
      </select>
    </div>
  );
}
