import Link from "next/link";
import { getCurrentUser } from "@/lib/data";
import SignOutButton from "@/components/SignOutButton";

export default async function NavBar() {
  const current = await getCurrentUser();

  return (
    <header className="border-b border-[var(--pcr-border)] bg-[var(--pcr-bg)] sticky top-0 z-10">
      <div className="w-full max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display text-xl md:text-2xl text-[var(--pcr-fg)] hover:text-[var(--pcr-accent-strong)] transition-colors no-underline"
        >
          Pro Clubs <span className="text-[var(--pcr-accent-strong)]">Ranked</span>
        </Link>

        <nav className="flex items-center gap-4 md:gap-6 text-sm">
          {current ? (
            <>
              <Link
                href="/queue"
                className="hidden sm:inline text-[var(--pcr-fg)] hover:text-[var(--pcr-accent-strong)] no-underline"
              >
                Queue
              </Link>
              <Link
                href="/leaderboard"
                className="hidden sm:inline text-[var(--pcr-fg)] hover:text-[var(--pcr-accent-strong)] no-underline"
              >
                Leaderboard
              </Link>
              <span className="hidden md:inline font-[family-name:var(--font-mono)] text-xs text-[var(--pcr-muted)]">
                {current.profile?.username ?? current.user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/leaderboard"
                className="hidden sm:inline text-[var(--pcr-fg)] hover:text-[var(--pcr-accent-strong)] no-underline"
              >
                Leaderboard
              </Link>
              <Link
                href="/login"
                className="text-[var(--pcr-fg)] hover:text-[var(--pcr-accent-strong)] no-underline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-[var(--pcr-accent-strong)] text-white px-3 py-1.5 no-underline hover:opacity-90 transition-opacity"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
