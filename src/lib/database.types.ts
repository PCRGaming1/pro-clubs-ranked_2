// Hand-written types mirroring `supabase/schema.sql`, shaped the same way
// the Supabase CLI's `supabase gen types typescript` output would be
// (Tables/Views/Functions/Enums/CompositeTypes, with a `Relationships`
// array per table) so it satisfies @supabase/supabase-js's generic
// constraints.
//
// There is no live Supabase project to generate this from yet — once one
// exists, prefer running the real generator and replacing this file:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
// Until then, keep this in sync with supabase/schema.sql by hand.

export type Platform = "ps" | "xbox" | "pc";
export type QueueSize =
  | "2v2"
  | "3v3"
  | "4v4"
  | "5v5"
  | "6v6"
  | "7v7"
  | "8v8"
  | "9v9"
  | "10v10"
  | "11v11";
export type QueueStatus = "waiting" | "matched" | "cancelled";
export type MatchStatus = "pending" | "confirmed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          platform: Platform | null;
          region: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          platform?: Platform | null;
          region?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          platform?: Platform | null;
          region?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      squads: {
        Row: {
          id: string;
          name: string;
          captain_id: string | null;
          platform: string | null;
          region: string | null;
          xp: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          captain_id?: string | null;
          platform?: string | null;
          region?: string | null;
          xp?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          captain_id?: string | null;
          platform?: string | null;
          region?: string | null;
          xp?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      squad_members: {
        Row: {
          squad_id: string;
          user_id: string;
          role: string;
        };
        Insert: {
          squad_id: string;
          user_id: string;
          role?: string;
        };
        Update: {
          squad_id?: string;
          user_id?: string;
          role?: string;
        };
        Relationships: [];
      };
      queue_entries: {
        Row: {
          id: string;
          squad_id: string | null;
          size: string;
          platform: string | null;
          region: string | null;
          status: QueueStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          squad_id?: string | null;
          size: string;
          platform?: string | null;
          region?: string | null;
          status?: QueueStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          squad_id?: string | null;
          size?: string;
          platform?: string | null;
          region?: string | null;
          status?: QueueStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          size: string | null;
          platform: string | null;
          region: string | null;
          squad_a_id: string | null;
          squad_b_id: string | null;
          status: MatchStatus;
          winner_squad_id: string | null;
          reported_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          size?: string | null;
          platform?: string | null;
          region?: string | null;
          squad_a_id?: string | null;
          squad_b_id?: string | null;
          status?: MatchStatus;
          winner_squad_id?: string | null;
          reported_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          size?: string | null;
          platform?: string | null;
          region?: string | null;
          squad_a_id?: string | null;
          squad_b_id?: string | null;
          status?: MatchStatus;
          winner_squad_id?: string | null;
          reported_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
