import { ImageIcon } from "lucide-react";
import type { HazardReport } from "@/types/hazard";
import { formatDate } from "@/lib/constants";
import { CategoryBadge, SeverityBadge } from "./Badges";

export function ReportList({ reports, onSelect }: { reports: HazardReport[]; onSelect?: (r: HazardReport) => void }) {
  return (
    <ul className="divide-y divide-line">
      {reports.map((r) => {
        const body = (
          <>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
              {r.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : <ImageIcon size={18} />}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2"><CategoryBadge category={r.category} /><SeverityBadge severity={r.severity} /></div>
              <p className="mt-1 truncate text-sm">{r.description || "No description"}</p>
              <p className="text-xs text-slate-500">{formatDate(r.timestamp)} · {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</p>
            </div>
          </>
        );
        return (
          <li key={r.id}>
            {onSelect ? (
              <button onClick={() => onSelect(r)} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50">{body}</button>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
