import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEaClubMatches, type EaPlatform } from "@/lib/ea";

export const dynamic = "force-dynamic";

/**
 * EXPERIMENTAL — preview only, writes nothing.
 *
 * Fetches a squad's recent matches from EA (if it's linked to an EA club
 * via /api/ea/link-squad) and returns them as-is, alongside which of the
 * squad's members have a linked ea_persona_name to match against. This
 * intentionally does NOT write to player_match_stats: the real EA
 * response shape hasn't been verified yet (see src/lib/ea.ts), so the
 * safer next step is to look at what this endpoint actually returns for
 * a real club before building an auto-fill pipeline on top of it.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const squadId = body?.squadId as string | undefined;

  if (!squadId) {
    return NextResponse.json({ error: "squadId is required." }, { status: 400 });
  }

  const { data: squad } = await supabase
    .from("squads")
    .select("ea_club_id, ea_platform")
    .eq("id", squadId)
    .maybeSingle();

  if (!squad?.ea_club_id || !squad?.ea_platform) {
    return NextResponse.json(
      { error: "This squad isn't linked to an EA club yet." },
      { status: 400 }
    );
  }

  // Two queries rather than a typed embed (squad_members -> profiles) —
  // the hand-written Database type in src/lib/database.types.ts doesn't
  // encode FK relationship metadata for typed embeds, same reasoning as
  // getSquadMembers in src/lib/data.ts.
  const { data: memberRows } = await supabase
    .from("squad_members")
    .select("user_id")
    .eq("squad_id", squadId);

  const memberIds = (memberRows ?? []).map((m) => m.user_id);
  const { data: linkedMembers } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("username, ea_persona_name")
        .in("id", memberIds)
    : { data: [] as { username: string; ea_persona_name: string | null }[] };

  try {
    const matches = await getEaClubMatches(
      squad.ea_platform as EaPlatform,
      squad.ea_club_id
    );

    return NextResponse.json({
      note: "Preview only — nothing was written. Compare `matches` against `linkedMembers` to check the response shape before wiring up auto-fill.",
      linkedMembers: linkedMembers ?? [],
      matches,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not reach EA's match data right now.",
      },
      { status: 502 }
    );
  }
}
