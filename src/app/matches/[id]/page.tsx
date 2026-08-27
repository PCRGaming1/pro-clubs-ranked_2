import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMatchById,
  getSquadById,
  getCurrentUser,
  getMatchReportsForMatch,
  getPlayerMatchStatsForMatch,
} from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import TierBadge from "@/components/TierBadge";
import ReportResultClient from "./ReportResultClient";
import StatsClient from "./StatsClient";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const [squadA, squadB, current, reports, stats] = await Promise.all([
    match.squad_a_id ? getSquadById(match.squad_a_id) : null,
    match.squad_b_id ? getSquadById(match.squad_b_id) : null,
    getCurrentUser(),
    getMatchReportsForMatch(match.id),
    match.status === "confirmed" ? getPlayerMatchStatsForMatch(match.id) : Promise.resolve([]),
  ]);

  let viewerSquadId: string | null = null;
  if (current) {
    const supabase = await createClient();
    const { data: membership } = await supabase
      .from("squad_members")
      .select("squad_id")
      .eq("user_id", current.user.id)
      .in("squad_id", [match.squad_a_id, match.squad_b_id].filter(Boolean) as string[])
      .maybeSingle();
    viewerSquadId = membership?.squad_id ?? null;
  }

  const squadAReport = reports.find((r) => r.squad_id === match.squad_a_id);
  const squadBReport = reports.find((r) => r.squad_id === match.squad_b_id);
  const ownReport = viewerSquadId === match.squad_a_id ? squadAReport : viewerSquadId === match.squad_b_id ? squadBReport : undefined;
  const otherReport = viewerSquadId === match.squad_a_id ? squadBReport : viewerSquadId === match.squad_b_id ? squadAReport : undefined;

  function winnerName(winnerId: string | null | undefined) {
    if (!winnerId) return "—";
    return winnerId === squadA?.id ? (squadA?.name ?? "—") : (squadB?.name ?? "—");
  }

  const statusLabel =
    match.status === "confirmed" ? "Confirmed" : match.status === "disputed" ? "Disputed" : "Pending";

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl mb-1">{match.size} Match</h1>
      <p className="text-sm text-[var(--pcr-muted)] mb-6">
        {statusLabel} · {match.platform?.toUpperCase() ?? "—"} · {match.region ?? "—"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4 mb-8">
        <SquadCard
          squad={squadA}
          isWinner={match.status === "confirmed" && match.winner_squad_id === squadA?.id}
        />
        <span className="font-display text-2xl text-center text-[var(--pcr-muted)]">VS</span>
        <SquadCard
          squad={squadB}
          isWinner={match.status === "confirmed" && match.winner_squad_id === squadB?.id}
        />
      </div>

      {match.status === "confirmed" ? (
        <p className="text-center text-sm text-[var(--pcr-success)]">
          Result confirmed
          {match.winner_squad_id
            ? ` — ${match.winner_squad_id === squadA?.id ? squadA?.name : squadB?.name} won.`
            : "."}
        </p>
      ) : match.status === "disputed" ? (
        <div className="rounded-lg border border-[var(--pcr-danger)] bg-[var(--pcr-danger)]/10 p-4 text-center mb-4">
          <p className="text-sm text-[var(--pcr-danger)] font-medium mb-1">
            Results don&apos;t match.
          </p>
          <p className="text-xs text-[var(--pcr-muted)] mb-4">
            {squadA?.name ?? "Squad A"} says {winnerName(squadAReport?.winner_squad_id)} won.{" "}
            {squadB?.name ?? "Squad B"} says {winnerName(squadBReport?.winner_squad_id)} won.
            No XP has been awarded — there&apos;s no automatic way to resolve a dispute yet (see
            the README). Either squad can correct its claim below.
          </p>
          {viewerSquadId && squadA && squadB && (
            <ReportResultClient
              matchId={match.id}
              squadA={squadA}
              squadB={squadB}
              ownWinnerId={ownReport?.winner_squad_id ?? null}
            />
          )}
        </div>
      ) : viewerSquadId && squadA && squadB ? (
        <div>
          <ReportResultClient
            matchId={match.id}
            squadA={squadA}
            squadB={squadB}
            ownWinnerId={ownReport?.winner_squad_id ?? null}
          />
          <p className="text-center text-xs text-[var(--pcr-muted)] mt-3">
            {otherReport
              ? "The other squad has reported too."
              : "Waiting on the other squad to report."}
          </p>
        </div>
      ) : (
        <p className="text-center text-sm text-[var(--pcr-muted)]">
          Waiting on both squads to report a result.
        </p>
      )}

      {match.status === "confirmed" && (
        <section className="mt-8">
          <h2 className="font-display text-xl mb-3">Player stats</h2>

          {viewerSquadId && (
            <div className="mb-4">
              <StatsClient
                matchId={match.id}
                initialGoals={stats.find((s) => s.user_id === current?.user.id)?.goals}
                initialAssists={stats.find((s) => s.user_id === current?.user.id)?.assists}
                initialMotm={stats.find((s) => s.user_id === current?.user.id)?.motm}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[squadA, squadB].map((squad) =>
              squad ? (
                <div key={squad.id}>
                  <h3 className="text-xs font-[family-name:var(--font-mono)] uppercase tracking-wide text-[var(--pcr-muted)] mb-2">
                    {squad.name}
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {stats
                      .filter((s) => s.squad_id === squad.id)
                      .map((s) => (
                        <li
                          key={s.user_id}
                          className="flex items-center justify-between rounded-md border border-[var(--pcr-border)] px-3 py-1.5"
                        >
                          <span className="flex items-center gap-2">
                            {s.username ?? "—"}
                            {s.motm && (
                              <span className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-wide text-[var(--pcr-gold)]">
                                MOTM
                              </span>
                            )}
                          </span>
                          <span className="font-mono-stat text-xs text-[var(--pcr-muted)]">
                            {s.goals}G {s.assists}A
                          </span>
                        </li>
                      ))}
                    {stats.filter((s) => s.squad_id === squad.id).length === 0 && (
                      <li className="text-[var(--pcr-muted)]">No stats logged yet.</li>
                    )}
                  </ul>
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      <p className="mt-8 text-xs text-[var(--pcr-muted)] text-center">
        Both squads must agree on the result before XP is awarded — see the README for what
        happens when they don&apos;t.
      </p>
    </div>
  );
}

function SquadCard({
  squad,
  isWinner,
}: {
  squad: { id: string; name: string; xp: number } | null;
  isWinner: boolean;
}) {
  if (!squad) {
    return <div className="rounded-lg border border-[var(--pcr-border)] p-4 text-center text-[var(--pcr-muted)]">Unknown squad</div>;
  }
  return (
    <div
      className={`rounded-lg border p-4 text-center ${
        isWinner ? "border-[var(--pcr-success)]" : "border-[var(--pcr-border)]"
      }`}
    >
      <Link href={`/squad/${squad.id}`} className="font-display text-lg no-underline hover:text-[var(--pcr-accent-strong)]">
        {squad.name}
      </Link>
      <div className="mt-1 flex items-center justify-center gap-2">
        <span className="font-mono-stat text-sm">{squad.xp} XP</span>
        <TierBadge xp={squad.xp} />
      </div>
      {isWinner && <div className="mt-1 text-xs text-[var(--pcr-success)] uppercase tracking-wide">Winner</div>}
    </div>
  );
}
