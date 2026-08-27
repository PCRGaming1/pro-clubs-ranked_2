"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  inputClass,
  labelClass,
  secondaryButtonClass,
  errorTextClass,
  successTextClass,
} from "@/components/form";

export default function EaPersonaLinkClient({
  initialValue,
}: {
  initialValue: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/ea/link-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eaPersonaName: value }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save.");
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
    <div className="mt-8 rounded-lg border border-[var(--pcr-border)] bg-[var(--pcr-bg-elevated)] p-4">
      <h2 className="text-sm font-[family-name:var(--font-mono)] uppercase tracking-wide text-[var(--pcr-muted)] mb-1">
        EA account (experimental)
      </h2>
      <p className="text-xs text-[var(--pcr-muted)] mb-3">
        Your exact PSN / Xbox gamertag / EA ID, as it shows up in-game.
        We&apos;re exploring pulling stats straight from EA instead of
        typing them in by hand — this is just linking the name for now,
        nothing is auto-imported yet.
      </p>
      <label className={labelClass} htmlFor="ea-persona">
        Persona name
      </label>
      <div className="flex gap-2">
        <input
          id="ea-persona"
          className={inputClass}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. your exact gamertag"
        />
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className={`${errorTextClass} mt-2`}>{error}</p>}
      {saved && !error && <p className={`${successTextClass} mt-2`}>Saved.</p>}
    </div>
  );
}
