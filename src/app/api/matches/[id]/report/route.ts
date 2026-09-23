import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Report (or update) your squad's claimed winner for a match.
 *
 * Both squads must independently report before anything is final: each
 * squad gets (at most) one row in `match_reports`, upserted here so a
 * squad can correct a mistaken claim by reporting again. Once both squads
 * have a row for this match:
 *   - if their claims agree, the match is confirmed and XP is awarded
 *     exactly once (see the conditional update below for the guard against
 *     double-awarding on a race or a re-run);
 *   - if they disagree, the match is marked 'disputed'. No XP is awarded
 *     and there's no auto-resolution — that's a deliberate, documented
 *     limitation (see README). Either squad can still re-report to correct
 *     itself, which re-runs this check and can resolve the dispute.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { winnerSquadId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { winnerSquadId } = body;
  if (!winnerSquadId) {
    return NextResponse.json({ error: "winnerSquadId is required." }, { status: 400 });
  }

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  if (match.status === "confirmed") {
    return NextResponse.json(
      { error: "This match's result is already confirmed." },
      { status: 409 }
    );
  }

  if (winnerSquadId !== match.squad_a_id && winnerSquadId !== match.squad_b_id) {
    return NextResponse.json(
      { error: "winnerSquadId must be one of the two squads in this match." },
      { status: 400 }
    );
  }

  const squadIds = [match.squad_a_id, match.squad_b_id].filter(Boolean) as string[];

  // Verify the requester belongs to one of the two squads in the match,
  // and find out which one — that's whose claim this report call is for.
  const { data: membership } = await supabase
    .from("squad_members")
    .select("squad_id")
    .eq("user_id", user.id)
    .in("squad_id", squadIds);

  const reporterSquadId = membership?.[0]?.squad_id;

  if (!reporterSquadId) {
    return NextResponse.json(
      { error: "You must belong to one of the two squads in this match to report it." },
      { status: 403 }
    );
  }

  const { error: upsertError } = await supabase.from("match_reports").upsert(
    {
      match_id: matchId,
      squad_id: reporterSquadId,
      winner_squad_id: winnerSquadId,
      reported_by: user.id,
    },
    { onConflict: "match_id,squad_id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const { data: reports } = await supabase
    .from("match_reports")
    .select("*")
    .eq("match_id", matchId);

  const reportA = reports?.find((r) => r.squad_id === match.squad_a_id);
  const reportB = reports?.find((r) => r.squad_id === match.squad_b_id);

  if (!reportA || !reportB) {
    // Still waiting on the other squad to report.
    return NextResponse.json({ ok: true, status: "pending" });
  }

  if (reportA.winner_squad_id === reportB.winner_squad_id) {
    // Agreement — confirm the match. The `.in("status", [...])` guard
    // ensures only one caller ever wins this transition (e.g. if both
    // squads' report calls raced each other right at the point both rows
    // existed), so XP below only ever gets awarded once per match.
    const { data: confirmedRows } = await supabase
      .from("matches")
      .update({ status: "confirmed", winner_squad_id: reportA.winner_squad_id })
      .eq("id", matchId)
      .in("status", ["pending", "disputed"])
      .select();

    if (confirmedRows && confirmedRows.length > 0) {
      // Award XP — overall ladder and this match size's ladder — in one
      // database transaction. award_match_xp() is a SECURITY DEFINER
      // function (see supabase/migration_004_mode_leaderboards.sql) that
      // flips matches.xp_awarded first, so it can only ever pay out once
      // per match even if called again.
      const { error: awardError } = await supabase.rpc("award_match_xp", {
        p_match_id: matchId,
      });

      if (awardError) {
        return NextResponse.json(
          {
            error: `Match confirmed, but XP could not be awarded: ${awardError.message}`,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, status: "confirmed" });
  }

  // Disagreement — mark disputed (unless it's already been confirmed by a
  // concurrent request, which the `.in()` filter guards against).
  await supabase
    .from("matches")
    .update({ status: "disputed" })
    .eq("id", matchId)
    .in("status", ["pending", "disputed"]);

  return NextResponse.json({ ok: true, status: "disputed" });
}
