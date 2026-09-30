import type { HazardReport } from "@/types/hazard";
import { formatTimestamp } from "@/lib/format";
import { CategoryBadge, SeverityBadge } from "@/components/ui/HazardBadges";

export function ReportPopupContent({ report }: { report: HazardReport }) {
  return (
    <div className="space-y-2 text-sm text-slate-800">
      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={report.category} />
        <SeverityBadge severity={report.severity} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-slate-500">Reported</dt>
        <dd>{formatTimestamp(report.timestamp)}</dd>
        <dt className="text-slate-500">Report ID</dt>
        <dd className="break-all font-mono text-xs">{report.id}</dd>
      </dl>
      {report.description ? <p className="text-slate-700">{report.description}</p> : null}
      {report.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={report.photoUrl} alt="Citizen-submitted photo" className="max-h-32 w-full rounded object-cover" />
      ) : null}
    </div>
  );
}
