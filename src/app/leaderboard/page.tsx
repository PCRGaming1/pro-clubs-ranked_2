import Link from "next/link";
import { getLeaderboard, getModeLeaderboard } from "@/lib/data";
import { MATCH_SIZES } from "@/lib/constants";
import type { MatchSize } from "@/lib/database.types";
import TierBadge from "@/components/TierBadge";

export const dynamic = "force-dynamic";

const TH =
  "px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]";

interface Row {
  id: string;
  name: string;
  platform: string | null;
  region: string | null;
  xp: number;
  record: { wins: number; losses: number } | null;
}

function parseMode(raw: string | string[] | undefined): MatchSize | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return MATCH_SIZES.find((s) => s === value) ?? null;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const mode = parseMode((await searchParams).mode);

  let rows: Row[];
  if (mode) {
    const modeRows = await getModeLeaderboard(mode);
    rows = modeRows.map((r) => ({
      id: r.squad_id,
      name: r.name,
      platform: r.platform,
      region: r.region,
      xp: r.xp,
      record: { wins: r.wins, losses: r.losses },
    }));
  } else {
    const squads = await getLeaderboard();
    rows = squads.map((s) => ({
      id: s.id,
      name: s.name,
      platform: s.platform,
      region: s.region,
      xp: s.xp,
      record: null,
    }));
  }

  const tabs: { label: string; href: string; active: boolean }[] = [
    { label: "Overall", href: "/leaderboard", active: mode === null },
    ...MATCH_SIZES.map((size) => ({
      label: size,
      href: `/leaderboard?mode=${size}`,
      active: mode === size,
    })),
  ];

  const colCount = mode ? 6 : 5;

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Leaderboard</h1>
      <p className="text-sm text-[var(--pcr-muted)] mb-6">
        {mode
          ? `${mode} only — XP earned from confirmed ${mode} matches.`
          : "Overall — XP from every confirmed match, all sizes combined."}
      </p>

      <nav
        aria-label="Leaderboard mode"
        className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm no-underline font-[family-name:var(--font-mono)] transition-colors ${
              tab.active
                ? "border-[var(--pcr-accent-strong)] bg-[var(--pcr-accent-strong)] text-[var(--pcr-accent-strong-fg)]"
                : "border-[var(--pcr-border)] hover:border-[var(--pcr-accent-strong)]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-lg border border-[var(--pcr-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--pcr-bg-elevated)] text-left">
            <tr>
              <th className={TH}>#</th>
              <th className={TH}>Squad</th>
              <th className={TH}>Platform / Region</th>
              {mode && <th className={`${TH} text-right`}>W–L</th>}
              <th className={TH}>Tier</th>
              <th className={`${TH} text-right`}>XP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className="border-t border-[var(--pcr-border)]">
                <td className="px-4 py-2 font-mono-stat text-[var(--pcr-muted)]">{i + 1}</td>
                <td className="px-4 py-2">
                  <Link
                    href={`/squad/${row.id}`}
                    className="no-underline hover:text-[var(--pcr-accent-strong)]"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-[var(--pcr-muted)]">
                  {row.platform?.toUpperCase() ?? "—"} · {row.region ?? "—"}
                </td>
                {row.record && (
                  <td className="px-4 py-2 text-right font-mono-stat">
                    {row.record.wins}–{row.record.losses}
                  </td>
                )}
                <td className="px-4 py-2">
                  <TierBadge xp={row.xp} />
                </td>
                <td className="px-4 py-2 text-right font-mono-stat">{row.xp}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-[var(--pcr-muted)]">
                  {mode ? (
                    <>
                      No confirmed {mode} matches yet.{" "}
                      <Link href="/challenges/new" className="text-[var(--pcr-accent-strong)]">
                        Post a {mode} challenge
                      </Link>{" "}
                      to get on this ladder.
                    </>
                  ) : (
                    "No squads yet. Be the first to create one."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
