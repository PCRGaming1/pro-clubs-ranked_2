import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Log a player's own stats for a confirmed match.
 *
 * `stats` is stored as a jsonb blob — `{"goals": 2, "assists": 1, "motm":
 * true}` — rather than as fixed columns, on purpose: the founder plans to
 * send a fuller list of stat fields later, and this way adding more
 * (clean sheets, ratings, whatever else) is just a matter of writing more
 * keys into this object, no schema migration required. The three keys
 * below are a small starter set, not the final list.
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

  let body: { goals?: number; assists?: number; motm?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const goals = Number(body.goals ?? 0);
  const assists = Number(body.assists ?? 0);
  const motm = Boolean(body.motm);

  if (!Number.isInteger(goals) || goals < 0 || goals > 50) {
    return NextResponse.json(
      { error: "goals must be a whole number between 0 and 50." },
      { status: 400 }
    );
  }
  if (!Number.isInteger(assists) || assists < 0 || assists > 50) {
    return NextResponse.json(
      { error: "assists must be a whole number between 0 and 50." },
      { status: 400 }
    );
  }

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  if (match.status !== "confirmed") {
    return NextResponse.json(
      { error: "Stats can only be logged once a match's result is confirmed." },
      { status: 400 }
    );
  }

  const squadIds = [match.squad_a_id, match.squad_b_id].filter(Boolean) as string[];

  const { data: membership } = await supabase
    .from("squad_members")
    .select("squad_id")
    .eq("user_id", user.id)
    .in("squad_id", squadIds)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "You must belong to one of the two squads in this match to log stats for it." },
      { status: 403 }
    );
  }

  const { error: upsertError } = await supabase.from("player_match_stats").upsert(
    {
      match_id: matchId,
      user_id: user.id,
      squad_id: membership.squad_id,
      stats: { goals, assists, motm },
    },
    { onConflict: "match_id,user_id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
