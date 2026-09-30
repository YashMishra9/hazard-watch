"use client";

import { useEffect, useRef } from "react";
import { Bell, CheckCheck } from "lucide-react";
import type { HazardAlert } from "@/lib/alerts";
import { countUnread } from "@/lib/alerts";
import { AlertCard } from "./AlertCard";

interface Props {
  alerts: HazardAlert[];
  selectedClusterId: string | null;
  onSelectAlert: (alert: HazardAlert) => void;
  onMarkRead: (alertId: string) => void;
  onMarkAllRead: () => void;
  city?: string;
  /** Shown when there are no alerts yet. */
  emptyHint?: string;
}

export function AlertPanel({
  alerts,
  selectedClusterId,
  onSelectAlert,
  onMarkRead,
  onMarkAllRead,
  city = "Pune",
  emptyHint = "Run hazard analysis to generate alerts from validated hotspots.",
}: Props) {
  const unread = countUnread(alerts);
  const listRef = useRef<HTMLDivElement>(null);

  // When a hotspot is selected on the map, bring its alert into view.
  useEffect(() => {
    if (!selectedClusterId) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-alert-id="alert:${CSS.escape(selectedClusterId)}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedClusterId]);

  return (
    <section aria-label="Hazard alerts" className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Bell className="h-4 w-4" aria-hidden /> Alerts
          {unread > 0 && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{unread} new</span>
          )}
        </h2>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unread === 0}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCheck className="h-3.5 w-3.5" aria-hidden /> Mark all viewed
        </button>
      </header>

      <div ref={listRef} className="max-h-[26rem] space-y-2 overflow-y-auto p-3">
        {alerts.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-500">{emptyHint}</p>
        ) : (
          alerts.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              city={city}
              selected={a.clusterId === selectedClusterId}
              onSelect={onSelectAlert}
              onMarkRead={onMarkRead}
            />
          ))
        )}
      </div>
    </section>
  );
}
