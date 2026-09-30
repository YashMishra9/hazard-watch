"use client";

import dynamic from "next/dynamic";
import type { HazardMapProps } from "./mapTypes";

/**
 * Public map component. Leaflet needs `window`, so the real implementation is
 * loaded client-side only (ssr: false). Import THIS, never HazardMapInner.
 *
 *   <HazardMap reports={reports} clusters={clusters} />
 */
const HazardMapInner = dynamic(() => import("./HazardMapInner"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[70vh] min-h-[420px] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500"
      role="status"
    >
      Loading map…
    </div>
  ),
});

export function HazardMap(props: HazardMapProps) {
  return <HazardMapInner {...props} />;
}

export default HazardMap;
