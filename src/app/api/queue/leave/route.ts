import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Cancel a squad's own waiting queue entry. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { squadId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { squadId } = body;
  if (!squadId) {
    return NextResponse.json({ error: "squadId is required." }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("squad_members")
    .select("squad_id")
    .eq("squad_id", squadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this squad." }, { status: 403 });
  }

  const { error } = await supabase
    .from("queue_entries")
    .update({ status: "cancelled" })
    .eq("squad_id", squadId)
    .eq("status", "waiting");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
