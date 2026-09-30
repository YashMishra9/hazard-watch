import type { HazardCluster } from "@/types/hazard";
import { formatCoords, formatTimestamp } from "@/lib/format";
import { CategoryBadge, SeverityBadge, StatusBadge } from "@/components/ui/HazardBadges";

interface Props {
  cluster: HazardCluster;
  /** When provided, contributing report IDs become buttons. */
  onSelectReport?: (reportId: string) => void;
  /** Hide the ID list (the side panel renders a richer one). */
  hideReportIds?: boolean;
}

/** Shared by the map popup and the side details panel so both always agree. */
export function ClusterDetailsBody({ cluster, onSelectReport, hideReportIds }: Props) {
  return (
    <div className="space-y-2 text-sm text-slate-800">
      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={cluster.category} />
        <SeverityBadge severity={cluster.severity} />
        <StatusBadge status={cluster.status} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-slate-500">Reports</dt>
        <dd className="font-semibold">{cluster.reportCount}</dd>
        <dt className="text-slate-500">Centroid</dt>
        <dd>{formatCoords(cluster.latitude, cluster.longitude)}</dd>
        <dt className="text-slate-500">Detected</dt>
        <dd>{formatTimestamp(cluster.detectedAt)}</dd>
        <dt className="text-slate-500">Hotspot ID</dt>
        <dd className="break-all font-mono text-xs">{cluster.id}</dd>
      </dl>
      {!hideReportIds && (
        <div>
          <p className="mb-1 text-slate-500">Contributing reports ({cluster.reportIds.length})</p>
          <ul className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
            {cluster.reportIds.map((id) => (
              <li key={id}>
                {onSelectReport ? (
                  <button
                    type="button"
                    onClick={() => onSelectReport(id)}
                    className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 hover:bg-slate-200"
                  >
                    {id}
                  </button>
                ) : (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{id}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
