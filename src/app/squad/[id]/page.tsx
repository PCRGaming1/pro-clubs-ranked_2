import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSquadById,
  getSquadMembers,
  getRecentMatchesForSquad,
} from "@/lib/data";
import TierBadge from "@/components/TierBadge";

export const dynamic = "force-dynamic";

export default async function SquadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const squad = await getSquadById(id);

  if (!squad) notFound();

  const [members, matches] = await Promise.all([
    getSquadMembers(squad.id),
    getRecentMatchesForSquad(squad.id),
  ]);

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
            <Link href="/queue" className="text-[var(--pcr-accent-strong)]">
              Join the queue
            </Link>{" "}
            to find one.
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
    </div>
  );
}
