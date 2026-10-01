"use client";
import { useMemo } from "react";
import { Clock, MapPin, ShieldAlert } from "lucide-react";
import type { HazardReport } from "@/types/hazard";
import { formatDate } from "@/lib/constants";
import { assessUrgent, type Assessment, type Outcome } from "@/lib/credibility";
import { unitsFor, type ResponseDecision } from "@/lib/response";
import { useDispatch } from "@/hooks/useDispatch";
import { CategoryBadge } from "./Badges";
import { Panel } from "./States";

const TONE: Record<Assessment["level"], string> = {
  high: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  medium: "bg-amber-50 text-amber-800 ring-amber-200",
  low: "bg-rose-50 text-rose-800 ring-rose-200",
};

const ACTIONS: { value: ResponseDecision["decision"]; label: string }[] = [
  { value: "deploy", label: "Send team now" },
  { value: "watch", label: "Verify first" },
  { value: "dismiss", label: "Mark as false" },
];

const STATUS: Record<ResponseDecision["decision"], string> = {
  deploy: "Team sent",
  watch: "Being verified",
  dismiss: "Marked false",
};

export function UrgentQueue({ reports }: { reports: HazardReport[] }) {
  const { decisions, decide } = useDispatch();

  const items = useMemo(() => {
    const outcomes: Record<string, Outcome> = {};
    for (const [key, d] of Object.entries(decisions)) {
      if (!key.startsWith("urgent:")) continue;
      if (d.decision === "deploy") outcomes[key.slice(7)] = "confirmed";
      if (d.decision === "dismiss") outcomes[key.slice(7)] = "false";
    }
    return reports
      .filter((r) => r.needsResponse)
      .map((r) => ({ report: r, assessment: assessUrgent(r, reports, outcomes), decision: decisions[`urgent:${r.id}`] }))
      .sort((a, b) =>
        Number(!!a.decision) - Number(!!b.decision) ||
        b.assessment.score - a.assessment.score ||
        Date.parse(b.report.timestamp) - Date.parse(a.report.timestamp));
  }, [reports, decisions]);

  if (items.length === 0) return null;
  const open = items.filter((i) => !i.decision).length;

  return (
    <Panel title={`Urgent requests${open ? ` (${open} open)` : ""}`}>
      <ul className="divide-y divide-line">
        {items.map(({ report: r, assessment: a, decision }) => (
          <li key={r.id} className="space-y-3 px-4 py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <ShieldAlert size={18} className="text-rose-600" aria-hidden />
              <CategoryBadge category={r.category} />
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${TONE[a.level]}`}>{a.label} ({a.score})</span>
              {decision && <span className="rounded-full bg-civic-dark px-2.5 py-0.5 text-xs font-semibold text-white">{STATUS[decision.decision]}</span>}
            </div>

            <div className="flex gap-3">
              {r.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.photoUrl} alt="Photo sent with the urgent request" className="h-20 w-20 shrink-0 rounded-lg border border-line object-cover" />
              )}
              <div className="min-w-0 text-sm">
                {r.description && <p className="font-medium">{r.description}</p>}
                <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden /> {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}</span>
                  <span className="inline-flex items-center gap-1"><Clock size={13} aria-hidden /> {formatDate(r.timestamp)}</span>
                </p>
                <ul className="mt-2 space-y-0.5 text-xs">
                  {a.reasons.map((x) => <li key={x} className="text-emerald-800">+ {x}</li>)}
                  {a.warnings.map((x) => <li key={x} className="text-rose-800">− {x}</li>)}
                </ul>
              </div>
            </div>

            <div role="group" aria-label="Your decision" className="flex flex-wrap gap-2">
              {ACTIONS.map(({ value, label }) => {
                const active = decision?.decision === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => decide(`urgent:${r.id}`, active ? null : { decision: value, units: value === "deploy" ? unitsFor(r.category) : [], decidedAt: new Date().toISOString() })}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium ${active ? "border-civic-dark bg-civic-dark text-white" : "border-line bg-white hover:bg-slate-50"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {decision?.decision === "deploy" && <p className="text-xs text-slate-600">Suggested teams: {decision.units.join(", ")}. Prototype: no team is contacted automatically.</p>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}