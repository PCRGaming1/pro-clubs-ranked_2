"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MATCH_SIZES } from "@/lib/constants";
import { inputClass, labelClass, primaryButtonClass, errorTextClass } from "@/components/form";

export default function NewPostForm({ squadId }: { squadId: string }) {
  const router = useRouter();
  const [size, setSize] = useState(MATCH_SIZES[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squadId, size, note: note.trim() || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not post a match.");
        setLoading(false);
        return;
      }

      router.push("/challenges");
    } catch {
      setError("Network error — try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Squad size</label>
        <div className="grid grid-cols-5 gap-2">
          {MATCH_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`rounded-md border px-2 py-2 text-sm font-mono-stat transition-colors ${
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

      <div>
        <label className={labelClass} htmlFor="note">
          Note (optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="e.g. looking for a friendly at 8pm"
          className={inputClass}
        />
      </div>

      {error && <p className={errorTextClass}>{error}</p>}

      <button type="submit" disabled={loading} className={primaryButtonClass}>
        {loading ? "Posting…" : "Post a match"}
      </button>
    </form>
  );
}
