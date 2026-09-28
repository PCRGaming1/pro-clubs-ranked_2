import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata = { title: "Reset password" };

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-3xl mb-1">Reset password</h1>
      <p className="text-sm text-[var(--pcr-muted)] mb-6">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
