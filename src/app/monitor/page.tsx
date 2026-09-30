"use client";

import { HazardMonitor } from "@/components/monitor/HazardMonitor";
import { loadDemoData, runHazardAnalysis } from "@/lib/monitor/adapters";

export default function MonitorPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <HazardMonitor loadDemoData={loadDemoData} runAnalysis={runHazardAnalysis} />
    </div>
  );
}
