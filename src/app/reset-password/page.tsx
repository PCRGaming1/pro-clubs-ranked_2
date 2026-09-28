import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = { title: "Set a new password" };

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  // The reset email link goes through /auth/confirm, which signs the user
  // in before sending them here. No session means the link was missing,
  // expired or already used.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-3xl mb-1">Set a new password</h1>
      {user ? (
        <>
          <p className="text-sm text-[var(--pcr-muted)] mb-6">
            Choose a new password for {user.email}.
          </p>
          <ResetPasswordForm />
        </>
      ) : (
        <p className="text-sm text-[var(--pcr-muted)] mt-4">
          This reset link has expired or was already used.{" "}
          <Link
            href="/forgot-password"
            className="text-[var(--pcr-accent-strong)]"
          >
            Request a new one
          </Link>
          .
        </p>
      )}
    </div>
  );
}
