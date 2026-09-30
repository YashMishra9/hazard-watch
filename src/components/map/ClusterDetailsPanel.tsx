import { MapPin, X } from "lucide-react";
import type { HazardCluster, HazardReport } from "@/types/hazard";
import { formatTimestamp } from "@/lib/format";
import { getContributingReports } from "@/lib/geo";
import { CATEGORY_META } from "./mapConfig";
import { ClusterDetailsBody } from "./ClusterDetailsBody";
import { SeverityBadge } from "@/components/ui/HazardBadges";

interface Props {
  cluster: HazardCluster;
  reportsById: ReadonlyMap<string, HazardReport>;
  onClose: () => void;
  /** Click a contributing report -> focus it on the map. */
  onSelectReport: (reportId: string) => void;
  focusedReportId?: string | null;
}

/** Side panel: hotspot summary + the individual reports that validated it. */
export function ClusterDetailsPanel({ cluster, reportsById, onClose, onSelectReport, focusedReportId }: Props) {
  const reports = getContributingReports(cluster, reportsById);
  const missing = cluster.reportIds.length - reports.length;

  return (
    <section aria-label="Hotspot details" className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MapPin className="h-4 w-4 text-emerald-600" aria-hidden /> Hotspot details
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close hotspot details"
          className="rounded p-1 text-slate-500 hover:bg-slate-100"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>

      <div className="space-y-4 px-4 py-3">
        <ClusterDetailsBody cluster={cluster} hideReportIds />

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contributing reports ({cluster.reportIds.length})
          </h3>
          <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {reports.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelectReport(r.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs hover:bg-slate-50 ${
                    r.id === focusedReportId ? "border-slate-900 bg-slate-50" : "border-slate-200"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-mono font-medium text-slate-900">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_META[r.category].color }}
                        aria-hidden
                      />
                      {r.id}
                    </span>
                    <SeverityBadge severity={r.severity} />
                  </span>
                  <span className="mt-1 block text-slate-500">{formatTimestamp(r.timestamp)}</span>
                  {r.description ? <span className="mt-0.5 block text-slate-700">{r.description}</span> : null}
                </button>
              </li>
            ))}
          </ul>
          {missing > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              {missing} contributing report{missing === 1 ? " is" : "s are"} not in the currently loaded report set.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
