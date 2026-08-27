"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass, primaryButtonClass, errorTextClass, successTextClass } from "@/components/form";

export default function StatsClient({
  matchId,
  initialGoals,
  initialAssists,
  initialMotm,
}: {
  matchId: string;
  initialGoals?: number;
  initialAssists?: number;
  initialMotm?: boolean;
}) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals ?? 0);
  const [assists, setAssists] = useState(initialAssists ?? 0);
  const [motm, setMotm] = useState(initialMotm ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/matches/${matchId}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals, assists, motm }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save stats.");
        setLoading(false);
        return;
      }

      setSaved(true);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[var(--pcr-border)] bg-[var(--pcr-bg-elevated)] p-4 space-y-3"
    >
      <h3 className="text-sm font-[family-name:var(--font-mono)] uppercase tracking-wide text-[var(--pcr-muted)]">
        Log your stats for this match
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="goals">
            Goals
          </label>
          <input
            id="goals"
            type="number"
            min={0}
            max={50}
            value={goals}
            onChange={(e) => setGoals(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="assists">
            Assists
          </label>
          <input
            id="assists"
            type="number"
            min={0}
            max={50}
            value={assists}
            onChange={(e) => setAssists(Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={motm} onChange={(e) => setMotm(e.target.checked)} />
        Man of the match
      </label>

      {error && <p className={errorTextClass}>{error}</p>}
      {saved && !error && <p className={successTextClass}>Saved.</p>}

      <button type="submit" disabled={loading} className={primaryButtonClass}>
        {loading ? "Saving…" : "Save stats"}
      </button>
    </form>
  );
}
