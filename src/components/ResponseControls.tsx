"use client";
import { Eye, Siren, XCircle, type LucideIcon } from "lucide-react";
import { formatDate } from "@/lib/constants";
import type { ResponseAdvice, ResponseDecision } from "@/lib/response";

const TONE = {
  deploy: "bg-rose-50 text-rose-900",
  watch: "bg-amber-50 text-amber-900",
  none: "bg-slate-50 text-slate-700",
} as const;

const CHOICES: { value: ResponseDecision["decision"]; label: string; icon: LucideIcon }[] = [
  { value: "deploy", label: "Send team", icon: Siren },
  { value: "watch", label: "Keep watching", icon: Eye },
  { value: "dismiss", label: "No action needed", icon: XCircle },
];

interface Props {
  advice: ResponseAdvice;
  decision: ResponseDecision | undefined;
  onDecide: (decision: ResponseDecision | null) => void;
}

export function ResponseControls({ advice, decision, onDecide }: Props) {
  const choose = (value: ResponseDecision["decision"]) => {
    if (decision?.decision === value) return onDecide(null); // press again to undo
    onDecide({
      decision: value,
      units: value === "deploy" ? (decision?.units.length ? decision.units : advice.units) : [],
      decidedAt: new Date().toISOString(),
    });
  };

  const toggleUnit = (unit: string) => {
    if (!decision) return;
    const units = decision.units.includes(unit) ? decision.units.filter((u) => u !== unit) : [...decision.units, unit];
    onDecide({ ...decision, units });
  };

  const unitOptions = Array.from(new Set([...advice.units, ...(decision?.units ?? [])]));

  return (
    <div className="mt-3 space-y-3">
      <div className={`rounded-xl p-3 text-sm ${TONE[advice.level]}`}>
        <p className="font-semibold">{advice.headline}</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
          {advice.reasons.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </div>

      <div role="group" aria-label="Your decision" className="flex flex-wrap gap-2">
        {CHOICES.map(({ value, label, icon: Icon }) => {
          const active = decision?.decision === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => choose(value)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
                active ? "border-civic-dark bg-civic-dark text-white" : "border-line bg-white hover:bg-slate-50"
              }`}
            >
              <Icon size={16} aria-hidden /> {label}
            </button>
          );
        })}
      </div>

      {decision?.decision === "deploy" && unitOptions.length > 0 && (
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-slate-600">Teams to send</legend>
          <div className="flex flex-wrap gap-2">
            {unitOptions.map((u) => (
              <label key={u} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs has-[:checked]:border-civic has-[:checked]:bg-civic-soft">
                <input type="checkbox" checked={decision.units.includes(u)} onChange={() => toggleUnit(u)} className="h-4 w-4" />
                {u}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {decision && (
        <p className="text-xs text-slate-500">
          Decision saved {formatDate(decision.decidedAt)}. Prototype: no team is contacted automatically.
        </p>
      )}
    </div>
  );
}