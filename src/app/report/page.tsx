"use client";
import { ReportForm } from "@/components/ReportForm";
import { ReportList } from "@/components/ReportList";
import { EmptyState, ErrorState, LoadingState, Panel } from "@/components/States";
import { useHazardData } from "@/hooks/useHazardData";

export default function ReportPage() {
  const { reports, status, error, reload } = useHazardData();
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div>
        <h1 className="text-2xl font-semibold">Report a hazard</h1>
        <p className="mb-5 mt-1 text-sm text-slate-600">Clusters of matching reports nearby are validated as hotspots and sent to the authorities.</p>
        <ReportForm />
      </div>
      <div className="lg:pt-[4.25rem]">
        <Panel title="Recent reports">
          {status === "loading" && <LoadingState />}
          {status === "error" && <div className="p-4"><ErrorState message={error ?? ""} onRetry={reload} /></div>}
          {status === "ready" && (reports.length === 0
            ? <EmptyState title="No reports yet" body="Reports you submit on this device appear here." />
            : <ReportList reports={reports.slice(0, 5)} />)}
        </Panel>
      </div>
    </div>
  );
}
