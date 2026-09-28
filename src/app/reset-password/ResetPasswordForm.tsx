"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  errorTextClass,
} from "@/components/form";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="password">
          New password
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
      <div>
        <label className={labelClass} htmlFor="confirm">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className={errorTextClass}>{error}</p>}

      <button type="submit" disabled={loading} className={primaryButtonClass}>
        {loading ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
