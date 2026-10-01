"use client";
import { Frown, Meh, Phone, Siren, type LucideIcon } from "lucide-react";
import type { Severity } from "@/types/hazard";

const STEPS: { value: Severity; label: string; text: string; icon: LucideIcon; color: string }[] = [
  { value: "low", label: "Small problem", text: "Annoying, but nobody is in danger.", icon: Meh, color: "#16a34a" },
  { value: "medium", label: "Big problem", text: "It blocks the way or could hurt someone soon.", icon: Frown, color: "#d97706" },
  { value: "high", label: "Dangerous", text: "People or property are in danger right now.", icon: Siren, color: "#dc2626" },
];

const ARROWS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

interface Props {
  value: Severity | null;
  onChange: (value: Severity) => void;
  needsResponse: boolean;
  onNeedsResponseChange: (value: boolean) => void;
  error?: string;
}

/**
 * Severity as a slider with pictures and colours instead of words, so it works for people who
 * find it hard to describe a situation in writing. Three stops map to low / medium / high.
 */
export function SeveritySlider({ value, onChange, needsResponse, onNeedsResponseChange, error }: Props) {
  const chosen = value !== null;
  const index = chosen ? STEPS.findIndex((s) => s.value === value) : 1;
  const current = STEPS[index]!;
  const pick = (i: number) => onChange(STEPS[i]!.value);

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">How bad is it?</legend>

      <div className="grid grid-cols-3 gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = chosen && i === index;
          return (
            // Pointer-only shortcut; the slider below is the accessible control.
            <button
              key={s.value}
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={() => pick(i)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center ${active ? "bg-white" : "border-transparent opacity-50"}`}
              style={active ? { borderColor: s.color } : undefined}
            >
              <Icon size={active ? 40 : 32} style={{ color: s.color }} aria-hidden />
              <span className="text-sm font-semibold">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="px-3 pb-2 pt-5">
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={index}
          data-untouched={!chosen}
          className="severity-range"
          aria-label="How bad is it? Slide from small problem to dangerous."
          aria-valuetext={chosen ? current.label : "Not chosen yet"}
          aria-invalid={!!error}
          aria-describedby={error ? "severity-err" : undefined}
          onChange={(e) => pick(Number(e.target.value))}
          onPointerDown={() => { if (!chosen) pick(index); }}
          onKeyDown={(e) => { if (!chosen && ARROWS.includes(e.key)) pick(index); }}
        />
      </div>

      <p aria-live="polite" className="min-h-10 text-center text-sm text-slate-600">
        {chosen ? <><span className="font-semibold text-ink">{current.label}.</span> {current.text}</> : "Move the dot to show how serious it is."}
      </p>

      {value === "high" && (
        <div className="mt-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-3 text-sm text-rose-950">
          <p className="flex items-center gap-2 font-semibold"><Phone size={16} aria-hidden /> If someone is hurt or in danger, call 112 now.</p>
          <p className="mt-1 text-xs">This app does not call emergency services for you. A person checks every urgent request before a team is sent. False emergency reports waste real help, and each device can send 2 urgent requests an hour. A photo and your GPS location help us act faster.</p>
          <label className="mt-3 flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={needsResponse} onChange={(e) => onNeedsResponseChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0" />
            <span>Ask the authorities to send a team to this place</span>
          </label>
        </div>
      )}

      {error && <p id="severity-err" className="mt-1 text-xs text-rose-700">{error}</p>}
    </fieldset>
  );
}