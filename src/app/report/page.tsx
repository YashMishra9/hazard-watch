"use client";
import { ReportForm } from "@/components/ReportForm";
import { ReportList } from "@/components/ReportList";
import { EmptyState, ErrorState, LoadingState, Panel } from "@/components/States";
import { useHazardData } from "@/hooks/useHazardData";
import { DEFAULT_ST_DBSCAN_OPTIONS as RULE } from "@/lib/clustering";

/** The validation rule drawn the way the map draws it: a dashed extent circle, reports inside, a count badge. */
function RuleDiagram({ className = "" }: { className?: string }) {
  const dots: [number, number][] = [[96, 50], [148, 80], [132, 142], [68, 136], [52, 88]];
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`${RULE.minReports} reports close together form a hotspot`}>
      <circle cx="100" cy="100" r="86" fill="#ffc83d" fillOpacity="0.1" stroke="#ffc83d" strokeWidth="2" strokeDasharray="7 7" />
      {dots.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <line x1="100" y1="100" x2={x} y2={y} stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" />
          <circle cx={x} cy={y} r="7" fill="#ffffff" />
        </g>
      ))}
      <circle cx="100" cy="100" r="19" fill="#ffc83d" stroke="#0c2340" strokeWidth="4" />
      <text x="100" y="106.5" textAnchor="middle" fontSize="19" fontWeight="700" fill="#0c2340">{RULE.minReports}</text>
    </svg>
  );
}

export default function ReportPage() {
  const { reports, status, error, reload } = useHazardData();
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-civic-dark text-white">
        <div className="hazard-stripe absolute inset-y-0 left-0 w-2" aria-hidden />
        <div className="grid items-center gap-6 py-8 pl-9 pr-6 sm:py-10 md:grid-cols-[1fr_auto] md:pr-10">
          <div>
            <h1 className="max-w-xl text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              A hazard becomes official at {RULE.minReports} reports.
            </h1>
            <p className="mt-4 max-w-lg text-base text-white/80">
              Report a pothole, flooding, e-waste or plastic dumping. When {RULE.minReports} people report the same kind of hazard
              within {RULE.spatialRadiusMeters} m and {RULE.temporalWindowMinutes} minutes of each other, it shows up as a validated
              hotspot on the authority dashboard.
            </p>
          </div>
          <RuleDiagram className="h-28 w-28 md:h-44 md:w-44" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">What did you see?</h2>
          <p className="mb-5 mt-1 text-sm text-slate-600">Prototype: reports are saved on this device only.</p>
          <ReportForm />
        </div>
        <div className="lg:pt-[3.75rem]">
          <Panel title="Recent reports">
            {status === "loading" && <LoadingState />}
            {status === "error" && <div className="p-4"><ErrorState message={error ?? ""} onRetry={reload} /></div>}
            {status === "ready" && (reports.length === 0
              ? <EmptyState title="No reports yet" body="Reports you submit on this device appear here." />
              : <ReportList reports={reports.slice(0, 5)} />)}
          </Panel>
        </div>
      </div>
    </div>
  );
}