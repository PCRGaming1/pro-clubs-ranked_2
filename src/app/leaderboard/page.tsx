import Link from "next/link";
import { getLeaderboard } from "@/lib/data";
import TierBadge from "@/components/TierBadge";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const squads = await getLeaderboard();

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Leaderboard</h1>

      <div className="overflow-x-auto rounded-lg border border-[var(--pcr-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--pcr-bg-elevated)] text-left">
            <tr>
              <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                #
              </th>
              <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                Squad
              </th>
              <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                Platform / Region
              </th>
              <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                Tier
              </th>
              <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)] text-right">
                XP
              </th>
            </tr>
          </thead>
          <tbody>
            {squads.map((squad, i) => (
              <tr key={squad.id} className="border-t border-[var(--pcr-border)]">
                <td className="px-4 py-2 font-mono-stat text-[var(--pcr-muted)]">{i + 1}</td>
                <td className="px-4 py-2">
                  <Link href={`/squad/${squad.id}`} className="no-underline hover:text-[var(--pcr-accent-strong)]">
                    {squad.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-[var(--pcr-muted)]">
                  {squad.platform?.toUpperCase() ?? "—"} · {squad.region ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <TierBadge xp={squad.xp} />
                </td>
                <td className="px-4 py-2 text-right font-mono-stat">{squad.xp}</td>
              </tr>
            ))}
            {squads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--pcr-muted)]">
                  No squads yet. Be the first to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
