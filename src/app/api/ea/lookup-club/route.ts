import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchEaClubs, type EaPlatform } from "@/lib/ea";

export const dynamic = "force-dynamic";

/**
 * EXPERIMENTAL. Search EA's (unofficial) club directory by name, so a
 * squad captain can find their club's EA club ID without hunting for it
 * themselves. See src/lib/ea.ts for the caveats.
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
  const platform = body?.platform as EaPlatform | undefined;
  const clubName = body?.clubName as string | undefined;

  if (!platform || !clubName) {
    return NextResponse.json(
      { error: "platform and clubName are required." },
      { status: 400 }
    );
  }

  try {
    const results = await searchEaClubs(platform, clubName);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not reach EA's club search right now.",
      },
      { status: 502 }
    );
  }
}
