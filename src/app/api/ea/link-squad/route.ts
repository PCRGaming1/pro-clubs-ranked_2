import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Save which EA club (and platform group) a squad corresponds to. Captain-only. */
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
  const eaClubId = (body?.eaClubId as string | undefined)?.trim() || null;
  const eaPlatform = (body?.eaPlatform as string | undefined)?.trim() || null;

  if (!squadId) {
    return NextResponse.json({ error: "squadId is required." }, { status: 400 });
  }

  const { data: squad } = await supabase
    .from("squads")
    .select("captain_id")
    .eq("id", squadId)
    .maybeSingle();

  if (!squad) {
    return NextResponse.json({ error: "Squad not found." }, { status: 404 });
  }

  if (squad.captain_id !== user.id) {
    return NextResponse.json(
      { error: "Only the squad captain can link an EA club." },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("squads")
    .update({ ea_club_id: eaClubId, ea_platform: eaPlatform })
    .eq("id", squadId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
