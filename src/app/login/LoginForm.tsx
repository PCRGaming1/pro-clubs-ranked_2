"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  errorTextClass,
} from "@/components/form";

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="••••••••"
        />
      </div>

      {error && <p className={errorTextClass}>{error}</p>}

      <button type="submit" disabled={loading} className={primaryButtonClass}>
        {loading ? "Logging in…" : "Log in"}
      </button>

      <p className="text-sm text-[var(--pcr-muted)]">
        Need an account?{" "}
        <Link href="/signup" className="text-[var(--pcr-accent-strong)]">
          Sign up
        </Link>
      </p>
    </form>
  );
}
