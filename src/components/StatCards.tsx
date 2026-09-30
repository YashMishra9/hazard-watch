import { Flame, Layers, MapPin, TriangleAlert, type LucideIcon } from "lucide-react";
import type { HazardCluster, HazardReport } from "@/types/hazard";
import { CATEGORIES, SEVERITIES } from "@/lib/constants";

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4">
      <div className="rounded-lg bg-civic-soft p-2.5 text-civic"><Icon size={20} /></div>
      <div><p className="text-2xl font-semibold leading-none">{value}</p><p className="mt-1 text-sm text-slate-600">{label}</p></div>
    </div>
  );
}

export function StatCards({ reports, clusters }: { reports: HazardReport[]; clusters: HazardCluster[] }) {
  const reportsInHotspots = clusters.reduce((n, c) => n + c.reportCount, 0);
  const unvalidatedReports = Math.max(0, reports.length - reportsInHotspots);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Stat label="Total reports" value={reports.length} icon={Layers} />
      <Stat label="Validated hotspots" value={clusters.length} icon={Flame} />
      <Stat label="High severity" value={reports.filter((r) => r.severity === "high").length} icon={TriangleAlert} />
      <Stat label="Reports in hotspots" value={reportsInHotspots} icon={MapPin} />
<Stat label="Unvalidated reports" value={unvalidatedReports} icon={TriangleAlert} />
    </div>
  );
}

function BarRow({ label, count, max, bar }: { label: string; count: number; max: number; bar: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-20 shrink-0">{label}</span>
      <div className="h-2.5 flex-1 rounded-full bg-slate-100"><div className={`h-full rounded-full ${bar}`} style={{ width: `${max ? (count / max) * 100 : 0}%` }} /></div>
      <span className="w-8 text-right tabular-nums">{count}</span>
    </div>
  );
}

export function Breakdown({ reports }: { reports: HazardReport[] }) {
  const byCat = CATEGORIES.map((c) => ({ ...c, n: reports.filter((r) => r.category === c.value).length }));
  const bySev = SEVERITIES.map((s) => ({ ...s, n: reports.filter((r) => r.severity === s.value).length }));
  const max = Math.max(1, ...byCat.map((x) => x.n), ...bySev.map((x) => x.n));
  return (
    <div className="grid gap-6 p-4 sm:grid-cols-2">
      <div className="space-y-2.5" aria-label="Reports by category">
        <h3 className="text-sm font-medium text-slate-500">By category</h3>
        {byCat.map((c) => <BarRow key={c.value} label={c.label} count={c.n} max={max} bar={c.bar} />)}
      </div>
      <div className="space-y-2.5" aria-label="Reports by severity">
        <h3 className="text-sm font-medium text-slate-500">By severity</h3>
        {bySev.map((s) => <BarRow key={s.value} label={s.label} count={s.n} max={max} bar={s.bar} />)}
      </div>
    </div>
  );
}
