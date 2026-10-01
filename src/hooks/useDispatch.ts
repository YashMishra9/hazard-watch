"use client";
import { useCallback, useEffect, useState } from "react";
import type { ResponseDecision } from "@/lib/response";

const KEY = "hazard.dispatch.v1";
const EVENT = "hazard-dispatch-changed";

type Store = Record<string, ResponseDecision>;

function read(): Store {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

/** Authority decisions per hotspot, saved on this device (same limits as the report data). */
export function useDispatch() {
  const [decisions, setDecisions] = useState<Store>({});

  useEffect(() => {
    const sync = () => setDecisions(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const decide = useCallback((key: string, decision: ResponseDecision | null) => {
    const next = { ...read() };
    if (decision) next[key] = decision;
    else delete next[key];
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage full or blocked: keep the in-memory state below */
    }
    setDecisions(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { decisions, decide };
}