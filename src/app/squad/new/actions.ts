"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateSquadState = { error: string | null };

/**
 * MVP limitation: one squad per user. We check for an existing
 * squad_members row before allowing a new squad to be created — see
 * README "known limitations" for why this needs revisiting.
 */
export async function createSquad(
  _prevState: CreateSquadState,
  formData: FormData
): Promise<CreateSquadState> {
  const name = String(formData.get("name") ?? "").trim();
  const platform = String(formData.get("platform") ?? "");
  const region = String(formData.get("region") ?? "");

  if (!name || name.length < 3) {
    return { error: "Squad name must be at least 3 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create a squad." };
  }

  const { data: existingMembership } = await supabase
    .from("squad_members")
    .select("squad_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMembership) {
    return { error: "You're already in a squad. Only one squad per player for now." };
  }

  const { data: squad, error: squadError } = await supabase
    .from("squads")
    .insert({
      name,
      captain_id: user.id,
      platform: platform || null,
      region: region || null,
    })
    .select()
    .single();

  if (squadError || !squad) {
    return {
      error: squadError?.message ?? "Could not create squad — name may already be taken.",
    };
  }

  const { error: memberError } = await supabase.from("squad_members").insert({
    squad_id: squad.id,
    user_id: user.id,
    role: "captain",
  });

  if (memberError) {
    return { error: memberError.message };
  }

  redirect(`/squad/${squad.id}`);
}
