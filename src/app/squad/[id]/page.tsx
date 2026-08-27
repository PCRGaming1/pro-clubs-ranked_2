import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCurrentUser,
  getSquadById,
  getSquadMembers,
  getRecentMatchesForSquad,
  getTopProsForSquad,
} from "@/lib/data";
import TierBadge from "@/components/TierBadge";
import EaClubLinkClient from "./EaClubLinkClient";

export const dynamic = "force-dynamic";

export default async function SquadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const squad = await getSquadById(id);

  if (!squad) notFound();

  const [current, members, matches, topPros] = await Promise.all([
    getCurrentUser(),
    getSquadMembers(squad.id),
    getRecentMatchesForSquad(squad.id),
    getTopProsForSquad(squad.id),
  ]);

  const isCaptain = current?.user.id === squad.captain_id;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl">{squad.name}</h1>
          <p className="text-sm text-[var(--pcr-muted)]">
            {squad.platform?.toUpperCase() ?? "—"} · {squad.region ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono-stat text-2xl">{squad.xp} XP</span>
          <TierBadge xp={squad.xp} />
        </div>
      </div>

      <section className="mb-8">
        <h2 className="font-display text-xl mb-3">Members</h2>
        <div className="overflow-x-auto rounded-lg border border-[var(--pcr-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--pcr-bg-elevated)] text-left">
              <tr>
                <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                  Player
                </th>
                <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.user_id} className="border-t border-[var(--pcr-border)]">
                  <td className="px-4 py-2">{m.username ?? "—"}</td>
                  <td className="px-4 py-2 capitalize">{m.role}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-center text-[var(--pcr-muted)]">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl mb-3">Recent matches</h2>
        {matches.length === 0 ? (
          <p className="text-sm text-[var(--pcr-muted)]">
            No matches yet.{" "}
            <Link href="/challenges" className="text-[var(--pcr-accent-strong)]">
              Find a match
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/matches/${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--pcr-border)] px-4 py-3 no-underline hover:border-[var(--pcr-accent-strong)] transition-colors"
                >
                  <span className="font-mono-stat text-sm">{m.size}</span>
                  <span className="text-sm capitalize">{m.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl mb-3">Top Pros</h2>
        <p className="text-xs text-[var(--pcr-muted)] mb-3">
          Squad members ranked by total goals across confirmed matches.
        </p>
        {topPros.length === 0 ? (
          <p className="text-sm text-[var(--pcr-muted)]">
            No player stats logged yet for this squad.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--pcr-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--pcr-bg-elevated)] text-left">
                <tr>
                  <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                    #
                  </th>
                  <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)]">
                    Player
                  </th>
                  <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)] text-right">
                    Goals
                  </th>
                  <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)] text-right">
                    Assists
                  </th>
                  <th className="px-4 py-2 font-[family-name:var(--font-mono)] uppercase text-xs text-[var(--pcr-muted)] text-right">
                    MOTM
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPros.map((p, i) => (
                  <tr key={p.user_id} className="border-t border-[var(--pcr-border)]">
                    <td className="px-4 py-2 font-mono-stat text-[var(--pcr-muted)]">{i + 1}</td>
                    <td className="px-4 py-2">{p.username ?? "—"}</td>
                    <td className="px-4 py-2 text-right font-mono-stat">{p.goals}</td>
                    <td className="px-4 py-2 text-right font-mono-stat">{p.assists}</td>
                    <td className="px-4 py-2 text-right font-mono-stat">{p.motm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isCaptain && (
        <EaClubLinkClient
          squadId={squad.id}
          initialClubId={squad.ea_club_id}
          initialPlatform={squad.ea_platform}
        />
      )}
    </div>
  );
}
