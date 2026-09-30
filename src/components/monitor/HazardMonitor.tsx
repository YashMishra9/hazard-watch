"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, Database, Loader2, Play, RotateCcw } from "lucide-react";
import type { HazardCluster, HazardReport } from "@/types/hazard";
import { HazardMap } from "@/components/map/HazardMap";
import { ClusterDetailsPanel } from "@/components/map/ClusterDetailsPanel";
import { AlertPanel } from "@/components/alerts/AlertPanel";
import { buildAlerts, countUnread, type HazardAlert } from "@/lib/alerts";
import { indexReports } from "@/lib/geo";
import type { LoadDemoData, RunHazardAnalysis } from "./contracts";

type Phase = "idle" | "loading" | "loaded" | "analyzing" | "analyzed";

interface Props {
  loadDemoData?: LoadDemoData;
  runAnalysis?: RunHazardAnalysis;
  city?: string;
}

function DetectionRules() {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">
          ST-DBSCAN detection rules
        </h2>
        <p className="text-xs text-slate-500">
          Reports are validated when they form a qualifying spatio-temporal group.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-civic-soft p-3">
          <p className="text-lg font-semibold text-civic">500 m</p>
          <p className="text-xs text-slate-600">Spatial radius</p>
        </div>

        <div className="rounded-lg bg-civic-soft p-3">
          <p className="text-lg font-semibold text-civic">30 min</p>
          <p className="text-xs text-slate-600">Time window</p>
        </div>

        <div className="rounded-lg bg-civic-soft p-3">
          <p className="text-lg font-semibold text-civic">≥ 5</p>
          <p className="text-xs text-slate-600">Reports required</p>
        </div>

        <div className="rounded-lg bg-civic-soft p-3">
          <p className="text-lg font-semibold text-civic">Same</p>
          <p className="text-xs text-slate-600">Hazard category</p>
        </div>
      </div>
    </div>
  );
}

function AnalysisSummary({
  reports,
  clusters,
}: {
  reports: HazardReport[];
  clusters: HazardCluster[];
}) {
  if (clusters.length === 0) return null;

  const reportsInHotspots = new Set(
    clusters.flatMap((cluster) => cluster.reportIds)
  ).size;

  const unvalidated = Math.max(0, reports.length - reportsInHotspots);

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />

        <div className="flex-1">
          <h2 className="font-semibold text-emerald-900">
            Analysis complete
          </h2>

          <p className="mt-1 text-sm text-emerald-800">
            ST-DBSCAN processed the reports and identified validated
            high-confidence hotspots.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xl font-bold text-slate-900">
                {reports.length}
              </p>
              <p className="text-xs text-slate-600">Reports analyzed</p>
            </div>

            <div>
              <p className="text-xl font-bold text-slate-900">
                {clusters.length}
              </p>
              <p className="text-xs text-slate-600">Hotspots validated</p>
            </div>

            <div>
              <p className="text-xl font-bold text-slate-900">
                {reportsInHotspots}
              </p>
              <p className="text-xs text-slate-600">Reports in hotspots</p>
            </div>

            <div>
              <p className="text-xl font-bold text-slate-900">
                {unvalidated}
              </p>
              <p className="text-xs text-slate-600">Unvalidated reports</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Runtime guard: never render a malformed cluster coming from another module. */
function isRenderableCluster(c: unknown): c is HazardCluster {
  const x = c as Partial<HazardCluster> | null;
  return (
    !!x &&
    typeof x.id === "string" &&
    Number.isFinite(x.latitude) &&
    Number.isFinite(x.longitude) &&
    Array.isArray(x.reportIds) &&
    typeof x.reportCount === "number"
  );
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function HazardMonitor({ loadDemoData, runAnalysis, city = "Pune" }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [clusters, setClusters] = useState<HazardCluster[]>([]);
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [focusedReportId, setFocusedReportId] = useState<string | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisMs, setAnalysisMs] = useState<number | null>(null);

  const reportsById = useMemo(() => indexReports(reports), [reports]);
  const alerts = useMemo(() => buildAlerts(clusters, readIds), [clusters, readIds]);
  const unread = countUnread(alerts);
  const selectedCluster = useMemo(
    () => clusters.find((c) => c.id === selectedClusterId) ?? null,
    [clusters, selectedClusterId],
  );

  const clearSelection = () => {
    setSelectedClusterId(null);
    setFocusedReportId(null);
  };

  const handleLoad = useCallback(async () => {
    if (!loadDemoData) return;
    setError(null);
    setPhase("loading");
    try {
      const data = await loadDemoData();
      if (!Array.isArray(data)) throw new Error("loadDemoData() did not return an array of HazardReport.");
      setReports(data);
      setClusters([]);
      setReadIds(new Set());
      setAnalysisMs(null);
      clearSelection();
      setPhase("loaded");
    } catch (e) {
      setError(`Could not load demo data: ${errMsg(e)}`);
      setPhase("idle");
    }
  }, [loadDemoData]);

  const handleAnalyze = useCallback(async () => {
    if (!runAnalysis || reports.length === 0) return;
    setError(null);
    setPhase("analyzing");
    try {
      const t0 = performance.now();
      const result = await runAnalysis(reports);
      const ms = performance.now() - t0;
      if (!Array.isArray(result)) throw new Error("runAnalysis() did not return an array of HazardCluster.");
      const valid = result.filter(isRenderableCluster);
      if (valid.length !== result.length) {
        console.warn(`[HazardMonitor] Ignored ${result.length - valid.length} malformed cluster(s).`);
      }
      setClusters(valid);
      setReadIds(new Set());
      setAnalysisMs(ms);
      clearSelection();
      setPhase("analyzed");
    } catch (e) {
      setError(`Hazard analysis failed: ${errMsg(e)}`);
      setPhase("loaded");
    }
  }, [runAnalysis, reports]);

  const handleReset = () => {
    setPhase("idle");
    setReports([]);
    setClusters([]);
    setReadIds(new Set());
    setAnalysisMs(null);
    setError(null);
    clearSelection();
  };

  const markRead = (id: string) => setReadIds((p) => new Set(p).add(id));
  const markAllRead = () => setReadIds(new Set(alerts.map((a) => a.id)));

  // Alert -> hotspot: select the cluster, clear any report focus, mark viewed, re-fly even if unchanged.
  const handleSelectAlert = (alert: HazardAlert) => {
    setFocusedReportId(null);
    setSelectedClusterId(alert.clusterId);
    setFocusNonce((n) => n + 1);
    markRead(alert.id);
  };

  // Hotspot -> contributing reports: focus one report on the map.
  const handleSelectReport = (id: string) => {
    setFocusedReportId(id);
    setFocusNonce((n) => n + 1);
  };

  const handleMapSelect = (id: string | null) => {
    setFocusedReportId(null);
    setSelectedClusterId(id);
  };

  const notConnected = !loadDemoData || !runAnalysis;
  const busy = phase === "loading" || phase === "analyzing";

  const steps = [
  {
    label: reports.length > 0
      ? `${reports.length} reports loaded`
      : "Load demo data",
    done: reports.length > 0,
    active: phase === "idle" || phase === "loading",
  },
  {
    label: phase === "analyzed"
      ? `${reports.length} reports analyzed`
      : "Run hazard analysis",
    done: phase === "analyzed",
    active: phase === "loaded" || phase === "analyzing",
  },
  {
    label: clusters.length > 0
      ? `${clusters.length} hotspots validated`
      : "Hotspots on map",
    done: clusters.length > 0,
    active: false,
  },
  {
    label: alerts.length > 0
      ? `${alerts.length} alerts generated`
      : "Alerts generated",
    done: alerts.length > 0,
    active: false,
  },
];

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hazard Monitor</h1>
          <p className="text-sm text-slate-600">
  Crowdsourced reports are validated by spatio-temporal clustering into hotspots and alerts.
</p>

<div className="mt-2 flex flex-wrap gap-2">
  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
    DEMO DATA · Pune
  </span>

  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
    ST-DBSCAN connected
  </span>
</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLoad}
            disabled={!loadDemoData || busy}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Database className="h-4 w-4" aria-hidden />}
            Load Demo Data
          </button>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!runAnalysis || reports.length === 0 || busy}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase === "analyzing" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            Run Hazard Analysis
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={busy || phase === "idle"}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Reset
          </button>
        </div>
      </header>

      {notConnected && (
        <div role="alert" className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Analysis modules are not connected yet. Export <code className="font-mono">loadDemoData</code> and{" "}
            <code className="font-mono">runHazardAnalysis</code> from{" "}
            <code className="font-mono">src/lib/monitor/adapters.ts</code> (wired to Developer 2&apos;s demo data and
            ST-DBSCAN). No placeholder results are shown.
          </p>
        </div>
      )}
      {error && (
  <div role="alert" className="flex gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
    <p>{error}</p>
  </div>
)}

<DetectionRules />

<ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Demo flow">
        {steps.map((s, i) => (
          <li
            key={s.label}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
              s.done
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : s.active
                  ? "border-slate-900 bg-white text-slate-900"
                  : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {s.done ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden /> : <Circle className="h-4 w-4 shrink-0" aria-hidden />}
            <span>
              {i + 1}. {s.label}
            </span>
          </li>
        ))}
      </ol>
      {phase === "analyzed" && (
        <AnalysisSummary
          reports={reports}
          clusters={clusters}
        />
      )}

      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat label="Reports" value={reports.length} />
        <Stat label="Validated hotspots" value={clusters.length} />
        <Stat label="Unread alerts" value={unread} />
        <Stat label="Analysis time" value={analysisMs === null ? "—" : `${analysisMs < 10 ? analysisMs.toFixed(1) : Math.round(analysisMs)} ms`} />
      </dl>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <HazardMap
          reports={reports}
          clusters={clusters}
          selectedClusterId={selectedClusterId}
          onSelectCluster={handleMapSelect}
          focusedReportId={focusedReportId}
          onSelectReport={handleSelectReport}
          focusNonce={focusNonce}
        />
        <div className="space-y-4">
          <AlertPanel
            alerts={alerts}
            selectedClusterId={selectedClusterId}
            onSelectAlert={handleSelectAlert}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            city={city}
          />
          {selectedCluster && (
            <ClusterDetailsPanel
              cluster={selectedCluster}
              reportsById={reportsById}
              onClose={clearSelection}
              onSelectReport={handleSelectReport}
              focusedReportId={focusedReportId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-lg font-bold text-slate-900">{value}</dd>
    </div>
  );
}

export default HazardMonitor;
