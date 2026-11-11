import { useState } from "react";
import { aiAreaSuggestions } from "@/features/ai/api/aiApi";
import { errStatus } from "@/shared/api/axiosClient";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toggleId } from "@/shared/lib/list";
import type { AiAreaSuggestion } from "@/shared/types/api";

export type SuggestionError = "unavailable" | "input" | null;

/** Form state (starting from the student's profile) and the "suggest areas" request. */
export function useAreaSuggestions() {
  const { user } = useAuth();
  const [schoolId, setSchoolId] = useState(user?.school_id != null ? String(user.school_id) : "");
  const [min, setMin] = useState(user?.budget_min != null ? String(user.budget_min) : "");
  const [max, setMax] = useState(user?.budget_max != null ? String(user.budget_max) : "");
  const [picks, setPicks] = useState<string[]>([]);
  const [rows, setRows] = useState<AiAreaSuggestion[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SuggestionError>(null);

  async function suggest(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { priorities: picks.length ? picks : undefined };
      if (schoolId) payload["school_id"] = Number(schoolId);
      if (min) payload["budget_min"] = Number(min);
      if (max) payload["budget_max"] = Number(max);
      setRows(await aiAreaSuggestions(payload));
    } catch (err) {
      setError(errStatus(err) === 503 ? "unavailable" : "input");
    } finally {
      setBusy(false);
    }
  }

  return {
    schoolId,
    setSchoolId,
    min,
    max,
    setBudget: (lo: string, hi: string) => {
      setMin(lo);
      setMax(hi);
    },
    picks,
    togglePick: (value: string) => {
      setPicks((cur) => toggleId(cur, value));
    },
    rows,
    busy,
    error,
    suggest,
  };
}

export type AreaSuggestions = ReturnType<typeof useAreaSuggestions>;
