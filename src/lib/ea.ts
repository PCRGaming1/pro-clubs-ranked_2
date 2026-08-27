/**
 * EXPERIMENTAL — unofficial EA Pro Clubs data.
 *
 * There is no public, documented, or supported EA API for Pro Clubs. What
 * every Discord stats bot and stat-tracking site out there actually uses
 * is a set of undocumented endpoints under proclubs.ea.com that EA's own
 * web/companion app calls internally. This file talks to the same
 * endpoints, but with zero guarantee they keep working:
 *
 *   - EA has never published a spec, a changelog, or a support channel
 *     for this. Field names, response shapes, even whether an endpoint
 *     exists at all can change without notice.
 *   - These endpoints went down site-wide for ~2 months in 2026 (an
 *     expired SSL certificate on EA's side) with no acknowledgement from
 *     EA staff on their own forums the whole time.
 *   - This has NOT been tested against a live response — the sandbox this
 *     was written in can't reach proclubs.ea.com to verify. Treat the
 *     shapes below as "best guess from public community write-ups",
 *     confirm against a real response before trusting the output, and
 *     expect to adjust field names once you see real data.
 *
 * None of this is wired into anything that writes to the database. It's
 * groundwork for an "auto-import" feature — self-reported stats
 * (src/app/matches/[id]/StatsClient.tsx) remain the only thing that
 * actually populates player_match_stats today.
 */

const EA_BASE = "https://proclubs.ea.com/api/fc";

// EA appears to group platforms rather than list them individually.
// "common-gen5" (current-gen consoles) is the value seen in the wild most
// often; PC and last-gen consoles may need a different value. Verify this
// against a club you know the platform of before relying on it.
export type EaPlatform = "common-gen5" | "common-gen4" | "pc";

export type EaClubSearchResult = {
  clubId: string;
  name: string;
  [key: string]: unknown;
};

export type EaClubMatch = {
  matchId?: string;
  timestamp?: string;
  clubs?: Record<string, unknown>;
  players?: Record<string, unknown>;
  [key: string]: unknown;
};

async function eaFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${EA_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  // Short timeout — this is a best-effort call to a service with no
  // uptime guarantee. Fail fast rather than hanging a request.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`EA endpoint returned ${res.status} for ${path}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** Search EA's club directory by name. */
export async function searchEaClubs(
  platform: EaPlatform,
  clubName: string
): Promise<EaClubSearchResult[]> {
  const data = await eaFetch("/allTimeLeaderboard/search", {
    platform,
    clubName,
  });
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch recent matches for a club. matchType is EA's own vocabulary —
 * "leagueMatch" for competitive Clubs matches, "friendlyMatch" for
 * friendlies. Unverified which values are actually accepted beyond those
 * two.
 */
export async function getEaClubMatches(
  platform: EaPlatform,
  clubId: string,
  matchType: "leagueMatch" | "friendlyMatch" = "leagueMatch",
  maxResultCount = 5
): Promise<EaClubMatch[]> {
  const data = await eaFetch("/clubs/matches", {
    platform,
    clubIds: clubId,
    matchType,
    maxResultCount: String(maxResultCount),
  });
  return Array.isArray(data) ? data : [];
}
