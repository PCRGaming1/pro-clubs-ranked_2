import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Cancel a squad's own still-open challenge-board post. */
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

  const { data: membership } = await supabase
    .from("squad_members")
    .select("squad_id")
    .eq("squad_id", post.squad_id ?? "")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of this post's squad." },
      { status: 403 }
    );
  }

  const { data: updated, error } = await supabase
    .from("match_posts")
    .update({ status: "cancelled" })
    .eq("id", postId)
    .eq("status", "open")
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json({ error: "This post is no longer open." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
