import { BellRing, Check, Clock, MapPin } from "lucide-react";
import type { HazardAlert } from "@/lib/alerts";
import { formatCoords, formatTimestamp } from "@/lib/format";
import { CATEGORY_META, SEVERITY_META } from "@/components/map/mapConfig";
import { CATEGORY_ICONS, SeverityBadge, StatusBadge } from "@/components/ui/HazardBadges";

interface Props {
  alert: HazardAlert;
  city: string;
  selected: boolean;
  onSelect: (alert: HazardAlert) => void;
  onMarkRead: (alertId: string) => void;
}

/**
 * Two sibling buttons (never nested): the main area focuses the hotspot on the
 * map; the footer button marks the alert as viewed.
 */
export function AlertCard({ alert, city, selected, onSelect, onMarkRead }: Props) {
  const { cluster, read } = alert;
  const Icon = CATEGORY_ICONS[cluster.category];
  const sev = SEVERITY_META[cluster.severity];

  return (
    <div
      data-alert-id={alert.id}
      className={`rounded-lg border text-sm transition-colors ${
        selected ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900" : "border-slate-200 bg-white"
      } ${read ? "opacity-80" : ""}`}
    >
      <button
        type="button"
        data-alert-main
        aria-pressed={selected}
        onClick={() => onSelect(alert)}
        className="block w-full rounded-t-lg p-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
      >
        <span className="flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
            style={{ color: read ? "#64748b" : sev.color }}
          >
            <BellRing className="h-3.5 w-3.5" aria-hidden />
            {read ? "Hazard alert" : "New hazard detected"}
          </span>
          {!read && <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-600" role="img" aria-label="Unread" />}
        </span>

        <span className="mt-2 flex items-center gap-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: CATEGORY_META[cluster.category].color }}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-slate-900">{CATEGORY_META[cluster.category].label}</span>
            <span className="block text-xs text-slate-600">{cluster.reportCount} reports</span>
          </span>
          <span className="ml-auto flex flex-col items-end gap-1">
            <SeverityBadge severity={cluster.severity} />
            <StatusBadge status={cluster.status} />
          </span>
        </span>

        <span className="mt-2 block space-y-0.5 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="sr-only">Location: </span>
            {city} · {formatCoords(cluster.latitude, cluster.longitude)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="sr-only">Detected: </span>
            {formatTimestamp(alert.createdAt)}
          </span>
        </span>
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
        <span className="text-xs text-slate-500">Click card to focus on map</span>
        {read ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
            <Check className="h-3.5 w-3.5" aria-hidden /> Viewed
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onMarkRead(alert.id)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Mark as viewed
          </button>
        )}
      </div>
    </div>
  );
}
