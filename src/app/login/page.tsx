import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-3xl mb-1">Log in</h1>
      <p className="text-sm text-[var(--pcr-muted)] mb-6">
        Welcome back. Log in to get to your squad and the queue.
      </p>
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
