"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { primaryButtonClass, errorTextClass, successTextClass } from "@/components/form";

type SquadLite = { id: string; name: string };

export default function ReportResultClient({
  matchId,
  squadA,
  squadB,
  ownWinnerId,
}: {
  matchId: string;
  squadA: SquadLite;
  squadB: SquadLite;
  ownWinnerId: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(ownWinnerId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  async function handleReport() {
    if (!selected) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/matches/${matchId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerSquadId: selected }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not report result.");
        setLoading(false);
        return;
      }

      setJustSubmitted(true);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--pcr-border)] bg-[var(--pcr-bg-elevated)] p-4">
      <h2 className="text-sm font-[family-name:var(--font-mono)] uppercase tracking-wide text-[var(--pcr-muted)] mb-3">
        {ownWinnerId ? "Your squad's claim" : "Report result"}
      </h2>

      {ownWinnerId && !justSubmitted && (
        <p className="text-sm mb-3">
          Your squad reported{" "}
          <strong>{ownWinnerId === squadA.id ? squadA.name : squadB.name} won</strong>. Pick
          again below if that was a mistake.
        </p>
      )}
      {justSubmitted && <p className={`${successTextClass} mb-3`}>Claim submitted.</p>}

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[squadA, squadB].map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelected(s.id)}
            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
              selected === s.id
                ? "border-[var(--pcr-accent-strong)] bg-[var(--pcr-accent-strong)]/10 text-[var(--pcr-accent-strong)]"
                : "border-[var(--pcr-border)] hover:border-[var(--pcr-accent-strong)]"
            }`}
          >
            {s.name} won
          </button>
        ))}
      </div>

      {error && <p className={`${errorTextClass} mb-3`}>{error}</p>}

      <button onClick={handleReport} disabled={!selected || loading} className={primaryButtonClass}>
        {loading ? "Submitting…" : ownWinnerId ? "Update claim" : "Submit claim"}
      </button>
    </div>
  );
}
