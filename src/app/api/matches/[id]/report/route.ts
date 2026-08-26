import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { XP_WIN, XP_LOSS } from "@/lib/xp";

export const dynamic = "force-dynamic";

/**
 * Report a match result.
 *
 * KNOWN LIMITATION (documented in README too): first report wins. Whoever
 * reports first sets the result; there is no confirmation step from the
 * other squad and no dispute/override flow. Fine for an MVP, not fine
 * forever — a real version needs both squads to confirm (or an admin
 * override) before a result is treated as final.
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
    return NextResponse.json({ error: "This match has already been reported." }, { status: 409 });
  }

  if (winnerSquadId !== match.squad_a_id && winnerSquadId !== match.squad_b_id) {
    return NextResponse.json(
      { error: "winnerSquadId must be one of the two squads in this match." },
      { status: 400 }
    );
  }

  // Verify the requester belongs to one of the two squads in the match.
  const { data: membership } = await supabase
    .from("squad_members")
    .select("squad_id")
    .eq("user_id", user.id)
    .in("squad_id", [match.squad_a_id, match.squad_b_id].filter(Boolean) as string[]);

  if (!membership || membership.length === 0) {
    return NextResponse.json(
      { error: "You must belong to one of the two squads in this match to report it." },
      { status: 403 }
    );
  }

  const loserSquadId = winnerSquadId === match.squad_a_id ? match.squad_b_id : match.squad_a_id;

  const { error: updateMatchError } = await supabase
    .from("matches")
    .update({
      status: "confirmed",
      winner_squad_id: winnerSquadId,
      reported_by: user.id,
    })
    .eq("id", matchId);

  if (updateMatchError) {
    return NextResponse.json({ error: updateMatchError.message }, { status: 500 });
  }

  // Award XP. Not done inside a single transaction/RPC — see the race
  // condition note in /api/queue/join for the same caveat class; here the
  // risk is limited to two near-simultaneous report calls on the same
  // match, which the `status === 'confirmed'` check above mostly guards
  // against (the second call will see status already confirmed and 409).
  const { data: winnerSquad } = await supabase
    .from("squads")
    .select("xp")
    .eq("id", winnerSquadId)
    .maybeSingle();

  if (winnerSquad) {
    await supabase
      .from("squads")
      .update({ xp: winnerSquad.xp + XP_WIN })
      .eq("id", winnerSquadId);
  }

  if (loserSquadId) {
    const { data: loserSquad } = await supabase
      .from("squads")
      .select("xp")
      .eq("id", loserSquadId)
      .maybeSingle();

    if (loserSquad) {
      await supabase
        .from("squads")
        .update({ xp: loserSquad.xp + XP_LOSS })
        .eq("id", loserSquadId);
    }
  }

  return NextResponse.json({ ok: true });
}
