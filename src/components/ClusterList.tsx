"use client";
import type { HazardCluster, HazardReport } from "@/types/hazard";
import { formatDate } from "@/lib/constants";
import { dispatchKey, recommendResponse } from "@/lib/response";
import { useDispatch } from "@/hooks/useDispatch";
import { CategoryBadge, SeverityBadge } from "./Badges";
import { ResponseControls } from "./ResponseControls";

export function ClusterList({ clusters, reports = [] }: { clusters: HazardCluster[]; reports?: HazardReport[] }) {
  const { decisions, decide } = useDispatch();
  return (
    <ul className="divide-y divide-line">
      {clusters.map((c) => {
        const key = dispatchKey(c);
        return (
          <li key={c.id} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <CategoryBadge category={c.category} /><SeverityBadge severity={c.severity} />
              <span className="text-sm font-medium">{c.reportCount} reports</span>
              <span className="text-xs text-slate-500">{c.latitude.toFixed(4)}, {c.longitude.toFixed(4)} · detected {formatDate(c.detectedAt)}</span>
            </div>
            <ResponseControls
              advice={recommendResponse(c, reports)}
              decision={decisions[key]}
              onDecide={(d) => decide(key, d)}
            />
          </li>
        );
      })}
    </ul>
  );
}