import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Accept an open challenge-board post, creating the match.
 *
 * CONCURRENCY GUARD: two different squads could try to accept the same
 * post at nearly the same instant. `UPDATE ... WHERE status = 'open'`
 * below is the guard — only one such call can flip the row from 'open' to
 * 'accepted'; whichever call loses the race gets zero rows back and this
 * returns a clear "already taken" error instead of silently double-booking
 * the poster (the failure mode the old auto-matchmaking queue had).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: post } = await supabase
    .from("match_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  if (post.status !== "open") {
    return NextResponse.json({ error: "This post was already taken." }, { status: 409 });
  }

  // MVP assumption: one squad per user (see README) — same assumption
  // getSquadForUser makes.
  const { data: membership } = await supabase
    .from("squad_members")
    .select("squad_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "You need a squad before you can accept a match." },
      { status: 403 }
    );
  }

  const accepterSquadId = membership.squad_id;

  if (accepterSquadId === post.squad_id) {
    return NextResponse.json(
      { error: "You can't accept your own squad's post." },
      { status: 400 }
    );
  }

  // Atomically flip open -> accepted. If another squad won the race, this
  // affects zero rows and `updated` comes back null.
  const { data: updated, error: updateError } = await supabase
    .from("match_posts")
    .update({ status: "accepted", accepted_by_squad_id: accepterSquadId })
    .eq("id", postId)
    .eq("status", "open")
    .select()
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json({ error: "This post was already taken." }, { status: 409 });
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      size: post.size,
      platform: post.platform,
      region: post.region,
      squad_a_id: post.squad_id,
      squad_b_id: accepterSquadId,
      status: "pending",
    })
    .select("id")
    .single();

  if (matchError || !match) {
    // The post is now stuck as 'accepted' with no match behind it — an MVP
    // trade-off, since there's no service-role key / RPC here to make the
    // accept + match-insert a single transaction. Rare in practice (the
    // insert only fails on real DB errors, not races), and recoverable by
    // hand for now.
    return NextResponse.json(
      { error: matchError?.message ?? "Accepted the post but could not create the match." },
      { status: 500 }
    );
  }

  await supabase.from("match_posts").update({ match_id: match.id }).eq("id", postId);

  return NextResponse.json({ ok: true, matchId: match.id });
}
