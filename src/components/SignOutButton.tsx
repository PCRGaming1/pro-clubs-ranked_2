"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="text-sm font-[family-name:var(--font-mono)] uppercase tracking-wide text-[var(--pcr-muted)] hover:text-[var(--pcr-accent-strong)] transition-colors disabled:opacity-50"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
