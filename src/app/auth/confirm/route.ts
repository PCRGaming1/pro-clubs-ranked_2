import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Landing route for every Supabase auth email link (signup confirmation,
// password reset, email change). Handles both link styles:
//   - token_hash + type: what the custom templates in supabase/templates send
//   - code: what Supabase's default templates send (PKCE flow)
// On success the session cookie is set and the user is sent to `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const defaultNext = type === "recovery" ? "/reset-password" : "/";
  const next = safeNext(searchParams.get("next")) ?? defaultNext;

  const supabase = await createClient();

  let ok = false;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (ok) {
    return NextResponse.redirect(new URL(next, origin));
  }

  const failUrl = new URL("/login", origin);
  failUrl.searchParams.set("error", "link_invalid");
  return NextResponse.redirect(failUrl);
}

// Only allow same-site relative paths, so the link can't be turned into an
// open redirect.
function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
