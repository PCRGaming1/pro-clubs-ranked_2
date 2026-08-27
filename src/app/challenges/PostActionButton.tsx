"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorTextClass } from "@/components/form";

const acceptClass =
  "rounded-md bg-[var(--pcr-accent-strong)] text-white text-sm font-medium px-4 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed";

const cancelClass =
  "rounded-md border border-[var(--pcr-border)] text-sm px-4 py-1.5 hover:bg-[var(--pcr-bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export default function PostActionButton({
  postId,
  variant,
}: {
  postId: string;
  variant: "accept" | "cancel";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${postId}/${variant}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      if (variant === "accept" && data.matchId) {
        router.push(`/matches/${data.matchId}`);
        return;
      }

      router.refresh();
    } catch {
      setError("Network error — try again.");
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={handleClick}
        disabled={loading}
        className={variant === "accept" ? acceptClass : cancelClass}
      >
        {loading
          ? variant === "accept"
            ? "Accepting…"
            : "Cancelling…"
          : variant === "accept"
            ? "Accept"
            : "Cancel"}
      </button>
      {error && <p className={`${errorTextClass} mt-1`}>{error}</p>}
    </div>
  );
}
