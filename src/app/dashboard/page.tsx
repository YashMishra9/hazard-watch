"use client";
import { useMemo, useState } from "react";
import { Flame, Inbox, Trash2 } from "lucide-react";
import type { HazardReport } from "@/types/hazard";
import { severityMeta } from "@/lib/constants";
import { hazardService } from "@/lib/hazardService";
import { useHazardData } from "@/hooks/useHazardData";
import { Breakdown, StatCards } from "@/components/StatCards";
import { ReportFilters, type Filters } from "@/components/ReportFilters";
import { ReportList } from "@/components/ReportList";
import { ReportDetails } from "@/components/ReportDetails";
import { ClusterList } from "@/components/ClusterList";
import { UrgentQueue } from "@/components/UrgentQueue";
import { EmptyState, ErrorState, LoadingState, Panel } from "@/components/States";
import { useToast } from "@/components/Toast";
import { HazardMap } from "@/components/map/HazardMap";
import { AlertPanel } from "@/components/alerts/AlertPanel";
import { buildAlerts, type HazardAlert } from "@/lib/alerts";

export default function DashboardPage() {
  const { reports, clusters, status, error, reload } = useHazardData();
  const toast = useToast();
  const [filters, setFilters] = useState<Filters>({ category: "all", severity: "all", sort: "newest" });
  const [selected, setSelected] = useState<HazardReport | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [readAlertIds, setReadAlertIds] = useState<ReadonlySet<string>>(new Set());
  const alerts = useMemo(() => buildAlerts(clusters, readAlertIds), [clusters, readAlertIds]);

  const visible = useMemo(() => {
    const list = reports.filter((r) => (filters.category === "all" || r.category === filters.category) && (filters.severity === "all" || r.severity === filters.severity));
    const by = {
      newest: (a: HazardReport, b: HazardReport) => +new Date(b.timestamp) - +new Date(a.timestamp),
      oldest: (a: HazardReport, b: HazardReport) => +new Date(a.timestamp) - +new Date(b.timestamp),
      severity: (a: HazardReport, b: HazardReport) => severityMeta(b.severity).rank - severityMeta(a.severity).rank,
    }[filters.sort];
    return [...list].sort(by);
  }, [reports, filters]);

  if (status === "loading") return <LoadingState label="Loading dashboard…" />;
  if (status === "error") return <ErrorState message={error ?? "Unknown error."} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Authority dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Citizen reports and the hotspots validated from them.</p>
        </div>
        {reports.length > 0 && (
          <button onClick={async () => { if (confirm("Delete all reports stored on this device?")) { await hazardService.clearReports(); toast("All reports cleared"); } }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm hover:bg-slate-50"><Trash2 size={16} /> Clear reports</button>
        )}
      </div>

            <UrgentQueue reports={reports} />

      <StatCards reports={reports} clusters={clusters} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Hotspot map"><HazardMap reports={reports} clusters={clusters} selectedClusterId={selectedClusterId} onSelectCluster={setSelectedClusterId} className="h-[32rem] min-h-[28rem]" /></Panel>
        <div className="space-y-6">
          <Panel title="Validated hotspots">
            {clusters.length === 0
              ? <EmptyState icon={Flame} title="No validated hotspots" body="Hotspots appear once enough nearby reports are clustered." />
              : <ClusterList clusters={clusters} reports={reports} />}
          </Panel>
          <Panel title="Recent alerts">
            <AlertPanel
              alerts={alerts}
              selectedClusterId={selectedClusterId}
              onSelectAlert={(alert: HazardAlert) => {
                setSelectedClusterId(alert.clusterId);
                setReadAlertIds((prev) => new Set(prev).add(alert.id));
              }}
              onMarkRead={(id) => setReadAlertIds((prev) => new Set(prev).add(id))}
              onMarkAllRead={() => setReadAlertIds(new Set(alerts.map((a) => a.id)))}
              city="Pune"
            />
          </Panel>
        </div>
      </div>

      <Panel title="Reports breakdown"><Breakdown reports={reports} /></Panel>

      <Panel title={`Reports (${visible.length})`} action={<ReportFilters value={filters} onChange={setFilters} />}>
        {reports.length === 0
          ? <EmptyState icon={Inbox} title="No reports yet" body="Reports submitted by citizens will appear here." />
          : visible.length === 0
            ? <EmptyState title="No reports match these filters" body="Try a different category or severity." />
            : <ReportList reports={visible} onSelect={setSelected} />}
      </Panel>

      {selected && <ReportDetails report={selected} clusters={clusters} onClose={() => setSelected(null)} />}
    </div>
  );
}
