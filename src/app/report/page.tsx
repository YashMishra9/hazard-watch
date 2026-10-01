"use client";
import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import { ReportForm } from "@/components/ReportForm";
import { ReportList } from "@/components/ReportList";
import { EmptyState, ErrorState, LoadingState, Panel } from "@/components/States";
import { HeroMap } from "@/components/HeroMap";
import { useHazardData } from "@/hooks/useHazardData";
import { DEFAULT_ST_DBSCAN_OPTIONS as RULE } from "@/lib/clustering";

const FADE = "linear-gradient(to right, transparent, #000 38%)";

export default function ReportPage() {
  const { reports, status, error, reload } = useHazardData();
  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-3xl bg-civic-dark text-white">
        <HeroMap
          count={RULE.minReports}
          className="absolute inset-y-0 right-0 -z-10 h-full w-full opacity-40 md:w-[64%] md:opacity-100"
          style={{ WebkitMaskImage: FADE, maskImage: FADE }}
        />
        <div className="hazard-stripe absolute inset-y-0 left-0 w-2" aria-hidden />
        <div className="relative py-10 pl-9 pr-6 sm:py-14 md:max-w-[36rem] lg:max-w-[40rem]">
          <h1 className="text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
            A hazard becomes official at {RULE.minReports} reports.
          </h1>
          <p className="mt-5 max-w-lg text-base text-white/80 sm:text-lg">
            Spot a pothole, flooding, e-waste or plastic dumping? Report it. When {RULE.minReports} neighbours report the same hazard
            close together, it lands on the authority dashboard as a validated hotspot.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5"><Users size={15} aria-hidden /> {RULE.minReports} reports</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5"><MapPin size={15} aria-hidden /> within {RULE.spatialRadiusMeters} m</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5"><Clock size={15} aria-hidden /> within {RULE.temporalWindowMinutes} minutes</span>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#report" className="rounded-xl bg-signal px-6 py-3.5 font-semibold text-civic-dark hover:brightness-95">Report a hazard</a>
            <Link href="/dashboard" className="rounded-xl border border-white/30 px-6 py-3.5 font-semibold hover:bg-white/10">See the dashboard</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div id="report" className="scroll-mt-6">
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