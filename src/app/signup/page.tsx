import SignupForm from "./SignupForm";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-3xl mb-1">Create account</h1>
      <p className="text-sm text-[var(--pcr-muted)] mb-6">
        Sign up to create or join a squad and start climbing the ladder.
      </p>
      <SignupForm />
    </div>
  );
}
