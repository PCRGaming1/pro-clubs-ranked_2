import Link from "next/link";
import { getCurrentUser, getSquadForUser } from "@/lib/data";
import SignOutButton from "@/components/SignOutButton";

export default async function NavBar() {
  const current = await getCurrentUser();

  // "Club" links straight to the user's own squad page — reusing the same
  // one-squad-per-user lookup the homepage and challenge board already use
  // (see src/lib/data.ts) rather than adding a new query. No squad yet ->
  // send them to /squad/new instead.
  const squadInfo = current ? await getSquadForUser(current.user.id) : null;
  const clubHref = squadInfo ? `/squad/${squadInfo.squad.id}` : "/squad/new";

  return (
    <header className="border-b border-[var(--pcr-navbar-border)] bg-[var(--pcr-navbar-bg)] sticky top-0 z-10">
      <div className="w-full max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display text-xl md:text-2xl text-[var(--pcr-navbar-fg)] hover:text-[var(--pcr-navbar-accent)] transition-colors no-underline"
        >
          Pro Clubs <span className="text-[var(--pcr-navbar-accent)]">Ranked</span>
        </Link>

        <nav className="flex items-center gap-4 md:gap-6 text-sm">
          {current ? (
            <>
              <Link
                href="/about"
                className="hidden sm:inline text-[var(--pcr-navbar-fg)] hover:text-[var(--pcr-navbar-accent)] no-underline"
              >
                About Us
              </Link>
              <Link
                href={clubHref}
                className="hidden sm:inline text-[var(--pcr-navbar-fg)] hover:text-[var(--pcr-navbar-accent)] no-underline"
              >
                Club
              </Link>
              <Link
                href="/profile"
                className="hidden sm:inline text-[var(--pcr-navbar-fg)] hover:text-[var(--pcr-navbar-accent)] no-underline"
              >
                Individual
              </Link>
              <Link
                href="/leaderboard"
                className="hidden sm:inline text-[var(--pcr-navbar-fg)] hover:text-[var(--pcr-navbar-accent)] no-underline"
              >
                Leaderboards
              </Link>
              <Link
                href="/challenges"
                className="hidden sm:inline text-[var(--pcr-navbar-fg)] hover:text-[var(--pcr-navbar-accent)] no-underline"
              >
                Matchmaking
              </Link>
              <span className="hidden md:inline font-[family-name:var(--font-mono)] text-xs text-[var(--pcr-navbar-muted)]">
                {current.profile?.username ?? current.user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/about"
                className="hidden sm:inline text-[var(--pcr-navbar-fg)] hover:text-[var(--pcr-navbar-accent)] no-underline"
              >
                About Us
              </Link>
              <Link
                href="/leaderboard"
                className="hidden sm:inline text-[var(--pcr-navbar-fg)] hover:text-[var(--pcr-navbar-accent)] no-underline"
              >
                Leaderboards
              </Link>
              <Link
                href="/login"
                className="text-[var(--pcr-navbar-fg)] hover:text-[var(--pcr-navbar-accent)] no-underline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-[var(--pcr-accent-strong)] text-[var(--pcr-accent-strong-fg)] px-3 py-1.5 no-underline hover:opacity-90 transition-opacity"
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
