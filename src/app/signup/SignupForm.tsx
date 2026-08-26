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
  successTextClass,
} from "@/components/form";

export default function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      // Email confirmation is disabled on this Supabase project — the
      // user is already logged in.
      router.push("/");
      router.refresh();
    } else {
      // Email confirmation is required before a session exists.
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <p className={successTextClass}>
        Almost there — check your email to confirm your account, then log in.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="username">
          Username
        </label>
        <input
          id="username"
          type="text"
          required
          minLength={3}
          maxLength={24}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
          placeholder="your-gamertag"
        />
      </div>
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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="At least 6 characters"
        />
      </div>

      {error && <p className={errorTextClass}>{error}</p>}

      <button type="submit" disabled={loading} className={primaryButtonClass}>
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="text-sm text-[var(--pcr-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--pcr-accent-strong)]">
          Log in
        </Link>
      </p>
    </form>
  );
}
