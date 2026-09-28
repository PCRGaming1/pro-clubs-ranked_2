import LoginForm from "./LoginForm";

export const metadata = { title: "Log in" };

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo, error } = await searchParams;

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-3xl mb-1">Log in</h1>
      <p className="text-sm text-[var(--pcr-muted)] mb-6">
        Welcome back. Log in to get to your squad and matchmaking.
      </p>
      {error === "link_invalid" && (
        <p className="text-sm text-[var(--pcr-danger)] mb-4">
          That email link is invalid or has expired. Log in below, or request a
          new link.
        </p>
      )}
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
