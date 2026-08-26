import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { QUEUE_SIZES } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Join the matchmaking queue for a squad.
 *
 * NOTE ON RACE CONDITIONS: this is a best-effort matcher, not a
 * transactionally-safe one. Two squads calling this endpoint for the same
 * size/platform/region within milliseconds of each other could each see no
 * opponent waiting and both insert a new 'waiting' row (a double-insert),
 * or — less likely but possible — two different squads could both read the
 * same single opponent row as available and both try to match against it
 * (a double-match) before either write lands. A production version should
 * do the "find opponent, insert match, mark both matched" sequence inside
 * a single Postgres function (RPC) using `SELECT ... FOR UPDATE SKIP
 * LOCKED` or similar row locking so it's atomic. Shipping the simple
 * read-then-write version for the MVP.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { squadId?: string; size?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { squadId, size } = body;

  if (!squadId || !size || !QUEUE_SIZES.includes(size as (typeof QUEUE_SIZES)[number])) {
    return NextResponse.json({ error: "squadId and a valid size are required." }, { status: 400 });
  }

  // Verify the requesting user is a member of this squad.
  const { data: membership } = await supabase
    .from("squad_members")
    .select("squad_id")
    .eq("squad_id", squadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this squad." }, { status: 403 });
  }

  const { data: squad } = await supabase
    .from("squads")
    .select("id, platform, region")
    .eq("id", squadId)
    .maybeSingle();

  if (!squad) {
    return NextResponse.json({ error: "Squad not found." }, { status: 404 });
  }

  // Idempotency: don't stack up duplicate waiting entries for the same
  // squad + size if this squad is already queued.
  const { data: alreadyWaiting } = await supabase
    .from("queue_entries")
    .select("id")
    .eq("squad_id", squadId)
    .eq("size", size)
    .eq("status", "waiting")
    .maybeSingle();

  let myEntryId: string;

  if (alreadyWaiting) {
    myEntryId = alreadyWaiting.id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("queue_entries")
      .insert({
        squad_id: squadId,
        size,
        platform: squad.platform,
        region: squad.region,
        status: "waiting",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message ?? "Could not join queue." },
        { status: 500 }
      );
    }
    myEntryId = inserted.id;
  }

  // Look for an opponent: oldest other waiting entry with matching
  // size/platform/region.
  let opponentQuery = supabase
    .from("queue_entries")
    .select("id, squad_id")
    .eq("status", "waiting")
    .eq("size", size)
    .neq("squad_id", squadId)
    .order("created_at", { ascending: true })
    .limit(1);

  opponentQuery = squad.platform
    ? opponentQuery.eq("platform", squad.platform)
    : opponentQuery.is("platform", null);
  opponentQuery = squad.region
    ? opponentQuery.eq("region", squad.region)
    : opponentQuery.is("region", null);

  const { data: opponentEntry } = await opponentQuery.maybeSingle();

  if (!opponentEntry) {
    return NextResponse.json({ matched: false, waiting: true });
  }

  // Found an opponent — create the match and mark both entries matched.
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      size,
      platform: squad.platform,
      region: squad.region,
      squad_a_id: squadId,
      squad_b_id: opponentEntry.squad_id,
      status: "pending",
    })
    .select("id")
    .single();

  if (matchError || !match) {
    return NextResponse.json(
      { error: matchError?.message ?? "Could not create match." },
      { status: 500 }
    );
  }

  await supabase
    .from("queue_entries")
    .update({ status: "matched" })
    .in("id", [myEntryId, opponentEntry.id]);

  return NextResponse.json({ matched: true, matchId: match.id });
}
