"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Browser-side Supabase client for use in Client Components.
 *
 * Reads env vars lazily (inside the function body) rather than at module
 * load time, so importing this file never crashes a build in an
 * environment where the real Supabase project doesn't exist yet.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
