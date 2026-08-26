import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchById, getSquadById, getCurrentUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import TierBadge from "@/components/TierBadge";
import ReportResultClient from "./ReportResultClient";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const [squadA, squadB, current] = await Promise.all([
    match.squad_a_id ? getSquadById(match.squad_a_id) : null,
    match.squad_b_id ? getSquadById(match.squad_b_id) : null,
    getCurrentUser(),
  ]);

  let viewerCanReport = false;
  if (current && match.status === "pending") {
    const supabase = await createClient();
    const { data: membership } = await supabase
      .from("squad_members")
      .select("squad_id")
      .eq("user_id", current.user.id)
      .in("squad_id", [match.squad_a_id, match.squad_b_id].filter(Boolean) as string[]);
    viewerCanReport = Boolean(membership && membership.length > 0);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl mb-1">
        {match.size} Match
      </h1>
      <p className="text-sm text-[var(--pcr-muted)] mb-6 capitalize">
        {match.status} · {match.platform?.toUpperCase() ?? "—"} · {match.region ?? "—"}
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
      ) : viewerCanReport && squadA && squadB ? (
        <ReportResultClient matchId={match.id} squadA={squadA} squadB={squadB} />
      ) : (
        <p className="text-center text-sm text-[var(--pcr-muted)]">
          Waiting on a result to be reported by a member of either squad.
        </p>
      )}

      <p className="mt-8 text-xs text-[var(--pcr-muted)] text-center">
        Results are first-report-wins for this MVP — see the README for why
        that&apos;s a known limitation.
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
