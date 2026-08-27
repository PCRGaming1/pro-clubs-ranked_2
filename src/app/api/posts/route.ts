import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MATCH_SIZES } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Post an open challenge-board entry for a squad.
 *
 * Platform/region are pulled from the squad's own record rather than
 * accepted from the client, so a post always reflects what the squad
 * actually plays on/in (matches the old queue/join behavior).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { squadId?: string; size?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { squadId, size, note } = body;

  if (!squadId || !size || !MATCH_SIZES.includes(size as (typeof MATCH_SIZES)[number])) {
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

  const trimmedNote = typeof note === "string" ? note.trim().slice(0, 200) : "";

  const { data: post, error: insertError } = await supabase
    .from("match_posts")
    .insert({
      squad_id: squadId,
      size,
      platform: squad.platform,
      region: squad.region,
      note: trimmedNote || null,
      status: "open",
    })
    .select("id")
    .single();

  if (insertError || !post) {
    return NextResponse.json(
      { error: insertError?.message ?? "Could not post a match." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, postId: post.id });
}
