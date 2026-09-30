"use client";

import { HazardMonitor } from "@/components/monitor/HazardMonitor";
import { loadDemoData, runHazardAnalysis } from "@/lib/monitor/adapters";

export default function MonitorPage() {
  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      <HazardMonitor loadDemoData={loadDemoData} runAnalysis={runHazardAnalysis} />
    </main>
  );
}
