import type { HazardCluster } from "@/types/hazard";
import { formatDate } from "@/lib/constants";
import { CategoryBadge, SeverityBadge } from "./Badges";

export function ClusterList({ clusters }: { clusters: HazardCluster[] }) {
  return (
    <ul className="divide-y divide-line">
      {clusters.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
          <CategoryBadge category={c.category} /><SeverityBadge severity={c.severity} />
          <span className="text-sm font-medium">{c.reportCount} reports</span>
          <span className="text-xs text-slate-500">{c.latitude.toFixed(4)}, {c.longitude.toFixed(4)} · detected {formatDate(c.detectedAt)}</span>
        </li>
      ))}
    </ul>
  );
}
