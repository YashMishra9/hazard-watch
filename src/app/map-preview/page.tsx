"use client";

import { useState } from "react";
import { HazardMap } from "@/components/map/HazardMap";
import { fixtureClusters, fixtureReports } from "@/dev/mapFixtures";

/** Dev-only page: renders static fixtures to exercise the map. Not the demo flow (see /monitor). */
export default function MapPreviewPage() {
  const [withClusters, setWithClusters] = useState(true);
  return (
    <main className="mx-auto max-w-7xl space-y-3 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-slate-900">Map preview (static fixtures)</h1>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={withClusters} onChange={(e) => setWithClusters(e.target.checked)} />
          Pass clusters
        </label>
      </div>
      <p className="text-sm text-slate-600">
        Fixture data for visual checks only — not ST-DBSCAN output.
      </p>
      <HazardMap reports={fixtureReports} clusters={withClusters ? fixtureClusters : []} />
    </main>
  );
}
