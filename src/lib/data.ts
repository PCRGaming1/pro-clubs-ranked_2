import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Squad = Database["public"]["Tables"]["squads"]["Row"];
export type SquadMember = Database["public"]["Tables"]["squad_members"]["Row"];
export type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

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

export async function getMatchById(id: string) {
  const supabase = await createClient();
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return match as MatchRow | null;
}
