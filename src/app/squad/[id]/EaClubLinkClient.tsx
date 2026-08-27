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

const PLATFORM_OPTIONS: { value: string; label: string }[] = [
  { value: "common-gen5", label: "PS5 / Xbox Series (current-gen)" },
  { value: "common-gen4", label: "PS4 / Xbox One (last-gen)" },
  { value: "pc", label: "PC" },
];

export default function EaClubLinkClient({
  squadId,
  initialClubId,
  initialPlatform,
}: {
  squadId: string;
  initialClubId: string | null;
  initialPlatform: string | null;
}) {
  const router = useRouter();
  const [clubId, setClubId] = useState(initialClubId ?? "");
  const [platform, setPlatform] = useState(initialPlatform ?? PLATFORM_OPTIONS[0].value);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewJson, setPreviewJson] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/ea/link-squad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squadId, eaClubId: clubId, eaPlatform: platform }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error ?? "Could not save.");
        setSaving(false);
        return;
      }

      setSaved(true);
      setSaving(false);
      router.refresh();
    } catch {
      setSaveError("Network error — try again.");
      setSaving(false);
    }
  }

  async function handlePreview() {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewJson(null);

    try {
      const res = await fetch("/api/ea/sync-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squadId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPreviewError(data.error ?? "Could not fetch a preview.");
        setPreviewLoading(false);
        return;
      }

      setPreviewJson(JSON.stringify(data, null, 2));
      setPreviewLoading(false);
    } catch {
      setPreviewError("Network error — try again.");
      setPreviewLoading(false);
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-[var(--pcr-border)] bg-[var(--pcr-bg-elevated)] p-4">
      <h2 className="text-sm font-[family-name:var(--font-mono)] uppercase tracking-wide text-[var(--pcr-muted)] mb-1">
        EA club link (experimental, captain only)
      </h2>
      <p className="text-xs text-[var(--pcr-muted)] mb-3">
        Links this squad to your actual EA club so stats could eventually be
        pulled in automatically instead of typed in by hand. This pulls
        from an unofficial EA endpoint that isn&apos;t guaranteed to keep
        working — nothing here writes to the leaderboard yet, self-reported
        stats still do that.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="ea-club-id">
            EA club ID
          </label>
          <input
            id="ea-club-id"
            className={inputClass}
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            placeholder="e.g. 834"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ea-platform">
            Platform group
          </label>
          <select
            id="ea-platform"
            className={inputClass}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            {PLATFORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save link"}
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={handlePreview}
          disabled={previewLoading || !initialClubId}
          title={!initialClubId ? "Save a club ID first" : undefined}
        >
          {previewLoading ? "Fetching…" : "Preview EA sync"}
        </button>
      </div>

      {saveError && <p className={`${errorTextClass} mt-2`}>{saveError}</p>}
      {saved && !saveError && <p className={`${successTextClass} mt-2`}>Saved.</p>}
      {previewError && <p className={`${errorTextClass} mt-2`}>{previewError}</p>}

      {previewJson && (
        <pre className="mt-3 max-h-64 overflow-auto rounded-md bg-[var(--pcr-bg)] border border-[var(--pcr-border)] p-3 text-xs">
          {previewJson}
        </pre>
      )}
    </div>
  );
}
