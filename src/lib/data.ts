import { createClient } from "@/lib/supabase/server";
import type { Database, MatchSize } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Squad = Database["public"]["Tables"]["squads"]["Row"];
export type SquadMember = Database["public"]["Tables"]["squad_members"]["Row"];
export type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
export type MatchPostRow = Database["public"]["Tables"]["match_posts"]["Row"];
export type MatchReportRow = Database["public"]["Tables"]["match_reports"]["Row"];
export type SquadModeStatRow = Database["public"]["Tables"]["squad_mode_stats"]["Row"];

/** Current authenticated user + their profile row, or null if logged out. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile as Profile | null };
}

/**
 * The squad the given user belongs to (MVP assumption: one squad per user —
 * see README "known limitations"). Returns null if they have none.
 */
export async function getSquadForUser(userId: string) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("squad_members")
    .select("squad_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;

  const { data: squad } = await supabase
    .from("squads")
    .select("*")
    .eq("id", membership.squad_id)
    .maybeSingle();

  if (!squad) return null;

  return { squad: squad as Squad, role: membership.role as string };
}

export async function getSquadById(id: string) {
  const supabase = await createClient();
  const { data: squad } = await supabase
    .from("squads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return squad as Squad | null;
}

export interface SquadMemberWithProfile {
  user_id: string;
  role: string;
  username: string | null;
}

/**
 * Members of a squad with their usernames attached. Done as two queries and
 * joined in application code (rather than a Supabase nested `select`) to
 * keep this working against the hand-written Database type above, which
 * doesn't encode foreign-key relationship metadata for typed embeds.
 */
export async function getSquadMembers(squadId: string): Promise<SquadMemberWithProfile[]> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("squad_members")
    .select("user_id, role")
    .eq("squad_id", squadId);

  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", userIds);

  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  return members.map((m) => ({
    user_id: m.user_id,
    role: m.role,
    username: usernameById.get(m.user_id) ?? null,
  }));
}

export async function getRecentMatchesForSquad(squadId: string) {
  const supabase = await createClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .or(`squad_a_id.eq.${squadId},squad_b_id.eq.${squadId}`)
    .order("created_at", { ascending: false })
    .limit(10);
  return (matches ?? []) as MatchRow[];
}

export async function getLeaderboard() {
  const supabase = await createClient();
  const { data: squads } = await supabase
    .from("squads")
    .select("*")
    .order("xp", { ascending: false })
    .limit(100);
  return (squads ?? []) as Squad[];
}

export interface ModeLeaderboardRow {
  squad_id: string;
  name: string;
  platform: string | null;
  region: string | null;
  xp: number;
  wins: number;
  losses: number;
}

/**
 * The ladder for one match size (2v2, 5v5, ...): squads ranked by the XP
 * they've earned in that size only. Squads that haven't played a
 * confirmed match at this size don't appear. Two queries joined in app
 * code, same reasoning as getSquadMembers above.
 */
export async function getModeLeaderboard(size: MatchSize): Promise<ModeLeaderboardRow[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("squad_mode_stats")
    .select("squad_id, xp, wins, losses")
    .eq("size", size)
    .order("xp", { ascending: false })
    .order("wins", { ascending: false })
    .limit(100);

  if (!rows || rows.length === 0) return [];

  const { data: squads } = await supabase
    .from("squads")
    .select("id, name, platform, region")
    .in(
      "id",
      rows.map((r) => r.squad_id)
    );
  const squadById = new Map((squads ?? []).map((s) => [s.id, s]));

  return rows.flatMap((r) => {
    const squad = squadById.get(r.squad_id);
    if (!squad) return [];
    return [
      {
        squad_id: r.squad_id,
        name: squad.name,
        platform: squad.platform,
        region: squad.region,
        xp: r.xp,
        wins: r.wins,
        losses: r.losses,
      },
    ];
  });
}

/** A squad's record in every size it has played, highest XP first. */
export async function getModeStatsForSquad(squadId: string): Promise<SquadModeStatRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("squad_mode_stats")
    .select("*")
    .eq("squad_id", squadId)
    .order("xp", { ascending: false });
  return (data ?? []) as SquadModeStatRow[];
}

export async function getMatchById(id: string) {
  const supabase = await createClient();
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return match as MatchRow | null;
}

export interface MatchPostWithSquad extends MatchPostRow {
  squad_name: string | null;
}

/**
 * Open posts on the challenge board, newest first, with the poster
 * squad's name attached. Done as two queries and joined in application
 * code (same reasoning as getSquadMembers above — the hand-written
 * Database type doesn't encode FK relationship metadata for typed embeds).
 */
export async function getOpenMatchPosts(): Promise<MatchPostWithSquad[]> {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("match_posts")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!posts || posts.length === 0) return [];

  const squadIds = [...new Set(posts.map((p) => p.squad_id).filter(Boolean))] as string[];
  const { data: squads } = await supabase.from("squads").select("id, name").in("id", squadIds);
  const nameById = new Map((squads ?? []).map((s) => [s.id, s.name]));

  return posts.map((p) => ({
    ...p,
    squad_name: p.squad_id ? nameById.get(p.squad_id) ?? null : null,
  }));
}

/** Both squads' claims (if any) for a match. At most two rows. */
export async function getMatchReportsForMatch(matchId: string): Promise<MatchReportRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("match_reports").select("*").eq("match_id", matchId);
  return (data ?? []) as MatchReportRow[];
}

export interface PlayerMatchStatWithUsername {
  user_id: string;
  squad_id: string;
  username: string | null;
  goals: number;
  assists: number;
  motm: boolean;
}

/**
 * Logged player stats for one match, with usernames attached. Reads the
 * `stats` jsonb column defensively (see the API route that writes it) so a
 * missing key just defaults rather than throwing.
 */
export async function getPlayerMatchStatsForMatch(
  matchId: string
): Promise<PlayerMatchStatWithUsername[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("player_match_stats")
    .select("user_id, squad_id, stats")
    .eq("match_id", matchId);

  if (!rows || rows.length === 0) return [];

  const userIds = rows.map((r) => r.user_id);
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds);
  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  return rows.map((r) => {
    const stats = (r.stats ?? {}) as { goals?: number; assists?: number; motm?: boolean };
    return {
      user_id: r.user_id,
      squad_id: r.squad_id,
      username: usernameById.get(r.user_id) ?? null,
      goals: Number(stats.goals ?? 0),
      assists: Number(stats.assists ?? 0),
      motm: Boolean(stats.motm),
    };
  });
}

export interface PlayerTotals {
  goals: number;
  assists: number;
  motm: number;
  matchesLogged: number;
}

/**
 * One player's own aggregated stats across every match they've logged
 * player_match_stats for, regardless of which squad it was for (unlike
 * getTopProsForSquad below, which is scoped to a single squad). Backs the
 * /profile ("Individual") page.
 */
export async function getPlayerStatsForUser(userId: string): Promise<PlayerTotals> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("player_match_stats")
    .select("stats")
    .eq("user_id", userId);

  const totals: PlayerTotals = { goals: 0, assists: 0, motm: 0, matchesLogged: 0 };
  for (const row of rows ?? []) {
    const stats = (row.stats ?? {}) as { goals?: number; assists?: number; motm?: boolean };
    totals.goals += Number(stats.goals ?? 0);
    totals.assists += Number(stats.assists ?? 0);
    totals.motm += stats.motm ? 1 : 0;
    totals.matchesLogged += 1;
  }
  return totals;
}

export interface TopPro {
  user_id: string;
  username: string | null;
  goals: number;
  assists: number;
  motm: number;
}

/**
 * "Top Pros" for a squad: members ranked by total goals across their
 * player_match_stats rows for that squad, summed across every confirmed
 * match they've logged stats for.
 */
export async function getTopProsForSquad(squadId: string): Promise<TopPro[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("player_match_stats")
    .select("user_id, stats")
    .eq("squad_id", squadId);

  if (!rows || rows.length === 0) return [];

  const totals = new Map<string, { goals: number; assists: number; motm: number }>();
  for (const row of rows) {
    const stats = (row.stats ?? {}) as { goals?: number; assists?: number; motm?: boolean };
    const current = totals.get(row.user_id) ?? { goals: 0, assists: 0, motm: 0 };
    current.goals += Number(stats.goals ?? 0);
    current.assists += Number(stats.assists ?? 0);
    current.motm += stats.motm ? 1 : 0;
    totals.set(row.user_id, current);
  }

  const userIds = [...totals.keys()];
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds);
  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  return [...totals.entries()]
    .map(([user_id, t]) => ({ user_id, username: usernameById.get(user_id) ?? null, ...t }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists);
}
