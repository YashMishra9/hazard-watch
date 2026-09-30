"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import type { HazardCluster, HazardReport } from "@/types/hazard";
import { formatDate } from "@/lib/constants";
import { CategoryBadge, SeverityBadge } from "./Badges";

export function ReportDetails({ report, clusters, onClose }: { report: HazardReport; clusters: HazardCluster[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const inCluster = clusters.find((c) => c.reportIds.includes(report.id));
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Report details" onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex flex-wrap gap-2"><CategoryBadge category={report.category} /><SeverityBadge severity={report.severity} /></div>
          <button autoFocus aria-label="Close details" onClick={onClose} className="rounded-full p-1 hover:bg-slate-100"><X size={18} /></button>
        </div>
        {report.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={report.photoUrl} alt="Reported hazard" className="mb-3 max-h-64 w-full rounded-lg object-cover" />
        )}
        <p className="text-sm">{report.description || "No description provided."}</p>
        <dl className="mt-4 grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
          <dt className="text-slate-500">Report ID</dt><dd className="break-all font-mono text-xs">{report.id}</dd>
          <dt className="text-slate-500">Submitted</dt><dd>{formatDate(report.timestamp)}</dd>
          <dt className="text-slate-500">Coordinates</dt><dd>{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</dd>
          <dt className="text-slate-500">Hotspot</dt>
          <dd>{inCluster ? `Part of validated hotspot ${inCluster.id} (${inCluster.reportCount} reports)` : "Not part of a validated hotspot"}</dd>
        </dl>
      </div>
    </div>
  );
}
