"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { CATEGORIES, CATEGORY_META, SEVERITIES, SEVERITY_META } from "./mapConfig";
import { CATEGORY_ICONS } from "@/components/ui/HazardBadges";

interface Props {
  reportCount: number;
  hotspotCount: number;
  showReports: boolean;
  showHotspots: boolean;
  onToggleReports: (v: boolean) => void;
  onToggleHotspots: (v: boolean) => void;
}

export function MapLegend({
  reportCount,
  hotspotCount,
  showReports,
  showHotspots,
  onToggleReports,
  onToggleHotspots,
}: Props) {
  const [open, setOpen] = useState(true);
  return (
    <div className="pointer-events-auto w-56 rounded-lg border border-slate-200 bg-white/95 text-xs text-slate-700 shadow-md backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 font-semibold text-slate-900"
      >
        <span className="inline-flex items-center gap-1.5">
          <Layers className="h-4 w-4" aria-hidden /> Legend
        </span>
        {open ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronUp className="h-4 w-4" aria-hidden />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-100 px-3 py-2">
          <section>
            <label className="flex cursor-pointer items-center justify-between gap-2 font-semibold text-slate-900">
              <span>Citizen reports ({reportCount})</span>
              <input type="checkbox" checked={showReports} onChange={(e) => onToggleReports(e.target.checked)} />
            </label>
            <p className="mt-0.5 flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full border-2 border-white bg-slate-500 shadow ring-1 ring-slate-300" />
              Small dot = single unverified report
            </p>
          </section>

          <section>
            <label className="flex cursor-pointer items-center justify-between gap-2 font-semibold text-slate-900">
              <span>Validated hotspots ({hotspotCount})</span>
              <input type="checkbox" checked={showHotspots} onChange={(e) => onToggleHotspots(e.target.checked)} />
            </label>
            <p className="mt-0.5 flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border-[3px] border-red-600 bg-slate-500 text-[9px] font-bold text-white">
                8
              </span>
              Numbered badge = report count
            </p>
            <p className="mt-1 flex items-center gap-1.5">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-dashed border-slate-500 bg-slate-500/10" />
              Dashed circle = hotspot extent
            </p>
          </section>

          <section>
            <p className="mb-1 font-semibold text-slate-900">Category (fill colour)</p>
            <ul className="space-y-1">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c];
                return (
                  <li key={c} className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: CATEGORY_META[c].color }} />
                    <Icon className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                    {CATEGORY_META[c].label}
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <p className="mb-1 font-semibold text-slate-900">Hotspot severity (ring colour)</p>
            <ul className="space-y-1">
              {SEVERITIES.map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border-[3px] bg-white"
                    style={{ borderColor: SEVERITY_META[s].color }}
                  />
                  {SEVERITY_META[s].label}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
