"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PostActionButton from "./PostActionButton";
import type { MatchSize } from "@/lib/database.types";

type Post = {
  id: string;
  size: string;
  platform: string | null;
  region: string | null;
  note: string | null;
  created_at: string;
  squad_id: string | null;
  squad_name: string | null;
};

const SIZE_GROUPS: { key: string; label: string; sizes: MatchSize[] }[] = [
  { key: "all", label: "All", sizes: [] },
  { key: "small", label: "Small", sizes: ["2v2", "3v3"] },
  { key: "medium", label: "Medium", sizes: ["4v4", "5v5", "6v6"] },
  { key: "large", label: "Large", sizes: ["7v7", "8v8", "9v9", "10v10", "11v11"] },
];

function groupForSize(size: string): string {
  const group = SIZE_GROUPS.find((g) => g.key !== "all" && (g.sizes as string[]).includes(size));
  return group?.key ?? "large";
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ChallengeBoardTable({
  posts,
  ownSquadId,
}: {
  posts: Post[];
  ownSquadId: string;
}) {
  const [activeTab, setActiveTab] = useState("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: posts.length, small: 0, medium: 0, large: 0 };
    for (const p of posts) c[groupForSize(p.size)]++;
    return c;
  }, [posts]);

  const filtered =
    activeTab === "all" ? posts : posts.filter((p) => groupForSize(p.size) === activeTab);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-1 border-b border-[var(--pcr-border)]">
          {SIZE_GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => setActiveTab(g.key)}
              className={`px-3 py-2 text-xs font-[family-name:var(--font-mono)] uppercase tracking-wide border-b-2 -mb-px transition-colors ${
                activeTab === g.key
                  ? "border-[var(--pcr-accent-strong)] text-[var(--pcr-fg)]"
                  : "border-transparent text-[var(--pcr-muted)] hover:text-[var(--pcr-fg)]"
              }`}
            >
              {g.label} ({counts[g.key] ?? 0})
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--pcr-muted)] font-[family-name:var(--font-mono)]">
          Open challenges: <span className="text-[var(--pcr-fg)]">{posts.length}</span>
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--pcr-muted)]">
          No open challenges in this range right now.{" "}
          <Link href="/challenges/new" className="text-[var(--pcr-accent-strong)]">
            Post one
          </Link>{" "}
          to be the first.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--pcr-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--pcr-bg-elevated)] text-left">
              <tr>
                <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                  Entry
                </th>
                <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                  Team size
                </th>
                <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                  Squad
                </th>
                <th className="hidden sm:table-cell px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                  Platform / Region
                </th>
                <th className="hidden md:table-cell px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                  Posted
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isOwn = p.squad_id === ownSquadId;
                return (
                  <tr key={p.id} className="border-t border-[var(--pcr-border)]">
                    <td className="px-4 py-3">
                      <span className="font-mono-stat text-xs font-bold text-[var(--pcr-accent-strong)]">
                        XP
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono-stat">{p.size}</td>
                    <td className="px-4 py-3">
                      {p.squad_id ? (
                        <Link
                          href={`/squad/${p.squad_id}`}
                          className="text-[var(--pcr-accent-strong)] no-underline"
                        >
                          {p.squad_name ?? "Unknown squad"}
                        </Link>
                      ) : (
                        (p.squad_name ?? "Unknown squad")
                      )}
                      {p.note && (
                        <p
                          className="text-xs text-[var(--pcr-muted)] mt-0.5 max-w-[16rem] truncate"
                          title={p.note}
                        >
                          &ldquo;{p.note}&rdquo;
                        </p>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-xs text-[var(--pcr-muted)]">
                      {p.platform?.toUpperCase() ?? "—"} · {p.region ?? "—"}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs text-[var(--pcr-muted)]">
                      {relativeTime(p.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {isOwn ? (
                        <PostActionButton postId={p.id} variant="cancel" />
                      ) : (
                        <PostActionButton postId={p.id} variant="accept" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
