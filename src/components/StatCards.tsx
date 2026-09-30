import { Flame, Layers, MapPin, TriangleAlert, type LucideIcon } from "lucide-react";
import type { HazardCluster, HazardReport } from "@/types/hazard";
import { CATEGORIES, SEVERITIES } from "@/lib/constants";

type Tone = "plain" | "signal" | "alert";
const TONE: Record<Tone, string> = {
  plain: "bg-white text-slate-700",
  signal: "bg-signal text-civic-dark",
  alert: "bg-rose-50 text-rose-900",
};

function Stat({ label, value, icon: Icon, tone = "plain", className = "" }: { label: string; value: number; icon: LucideIcon; tone?: Tone; className?: string }) {
  return (
    <div className={`flex flex-col justify-between gap-5 p-4 ${TONE[tone]} ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Icon size={18} aria-hidden />
      </div>
      <p className="font-display text-4xl font-bold leading-none tabular-nums text-ink">{value}</p>
    </div>
  );
}

export function StatCards({ reports, clusters }: { reports: HazardReport[]; clusters: HazardCluster[] }) {
  const reportsInHotspots = clusters.reduce((n, c) => n + c.reportCount, 0);
  const unvalidatedReports = Math.max(0, reports.length - reportsInHotspots);

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-5">
      <Stat label="Total reports" value={reports.length} icon={Layers} />
      <Stat label="Validated hotspots" value={clusters.length} icon={Flame} tone="signal" />
      <Stat label="High severity" value={reports.filter((r) => r.severity === "high").length} icon={TriangleAlert} tone="alert" />
      <Stat label="Reports in hotspots" value={reportsInHotspots} icon={MapPin} />
      <Stat label="Unvalidated reports" value={unvalidatedReports} icon={TriangleAlert} className="col-span-2 lg:col-span-1" />
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
