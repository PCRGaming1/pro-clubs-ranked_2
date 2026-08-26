"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QUEUE_SIZES } from "@/lib/constants";
import { primaryButtonClass, secondaryButtonClass, errorTextClass } from "@/components/form";

const POLL_INTERVAL_MS = 4000;

type JoinResponse = { matched: boolean; matchId?: string; waiting?: boolean; error?: string };

export default function QueueClient({ squadId }: { squadId: string }) {
  const router = useRouter();
  const [size, setSize] = useState(QUEUE_SIZES[0]);
  const [status, setStatus] = useState<"idle" | "waiting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => stopPolling, []);

  async function attemptJoin() {
    try {
      const res = await fetch("/api/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squadId, size }),
      });
      const data: JoinResponse = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        stopPolling();
        return;
      }

      if (data.matched && data.matchId) {
        stopPolling();
        router.push(`/matches/${data.matchId}`);
        return;
      }

      setStatus("waiting");
    } catch {
      setError("Network error — will keep retrying.");
    }
  }

  async function handleJoinClick() {
    setError(null);
    await attemptJoin();
    intervalRef.current = setInterval(attemptJoin, POLL_INTERVAL_MS);
  }

  async function handleLeaveClick() {
    stopPolling();
    setStatus("idle");
    try {
      await fetch("/api/queue/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squadId }),
      });
    } catch {
      // best-effort; the entry will just sit as 'waiting' until it's
      // superseded, which is harmless
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-[family-name:var(--font-mono)] uppercase tracking-wide text-[var(--pcr-muted)] mb-2">
          Squad size
        </label>
        <div className="grid grid-cols-5 gap-2">
          {QUEUE_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={status === "waiting"}
              onClick={() => setSize(s)}
              className={`rounded-md border px-2 py-2 text-sm font-mono-stat transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                size === s
                  ? "border-[var(--pcr-accent-strong)] bg-[var(--pcr-accent-strong)]/10 text-[var(--pcr-accent-strong)]"
                  : "border-[var(--pcr-border)] hover:border-[var(--pcr-accent-strong)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <p className={errorTextClass}>{error}</p>}

      {status === "waiting" ? (
        <div className="rounded-lg border border-[var(--pcr-border)] bg-[var(--pcr-bg-elevated)] p-4 text-center">
          <p className="mb-3 text-sm">
            Waiting for an opponent in <strong>{size}</strong>… checking every few
            seconds.
          </p>
          <button onClick={handleLeaveClick} className={secondaryButtonClass}>
            Leave queue
          </button>
        </div>
      ) : (
        <button onClick={handleJoinClick} className={primaryButtonClass}>
          Join queue
        </button>
      )}
    </div>
  );
}
