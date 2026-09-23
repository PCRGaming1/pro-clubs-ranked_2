import Link from "next/link";
import {
  getCurrentUser,
  getSquadForUser,
  getRecentMatchesForSquad,
  getSquadById,
} from "@/lib/data";
import TierBadge from "@/components/TierBadge";
import { Crest } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const current = await getCurrentUser();

  if (!current) {
    return (
      <div className="-mx-4 -mt-8 mb-8 md:rounded-b-2xl overflow-hidden bg-[linear-gradient(100deg,#05070a_0%,#0a1726_55%,#05070a_100%)] text-center px-4 py-16 md:py-20">
        <Crest size={56} />
        <h1 className="font-display text-3xl md:text-5xl mt-5 mb-4 text-[#eef7f0]">
          Find your next Pro Clubs match
        </h1>
        <p className="text-[#9fb3c4] mb-8 text-base md:text-lg max-w-2xl mx-auto">
          Post your club up for a match, get challenged by another squad your
          size, and climb the XP ladder. Built for EA FC Pro Clubs — 2v2 up to
          full 11v11.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-[var(--pcr-cta-strong)] text-[var(--pcr-cta-strong-fg)] font-semibold px-6 py-2.5 no-underline hover:opacity-90 transition-opacity"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[#2a3a48] text-[#eef7f0] px-6 py-2.5 no-underline hover:bg-white/5 transition-colors"
          >
            Log in
          </Link>
        </div>
        <p className="mt-8 text-xs text-[#7f93a3]">
          No cash prizes, wagering, or paid entry — this is a free XP ladder.
        </p>
      </div>
    );
  }

  const squadInfo = await getSquadForUser(current.user.id);

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">
        Welcome back, {current.profile?.username ?? "player"}
      </h1>

      {!squadInfo ? (
        <div className="rounded-lg border border-[var(--pcr-border)] bg-[var(--pcr-bg-elevated)] p-6 text-center">
          <p className="mb-4 text-[var(--pcr-fg)]">
            You&apos;re not in a squad yet. Create one to start queuing for
            matches.
          </p>
          <Link
            href="/squad/new"
            className="inline-block rounded-md bg-[var(--pcr-accent-strong)] text-[var(--pcr-accent-strong-fg)] font-medium px-5 py-2.5 no-underline hover:opacity-90 transition-opacity"
          >
            Create a squad
          </Link>
        </div>
      ) : (
        <SquadDashboard squadId={squadInfo.squad.id} />
      )}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/challenges"
          className="rounded-lg border border-[var(--pcr-border)] p-4 no-underline hover:border-[var(--pcr-accent-strong)] transition-colors"
        >
          <div className="font-display text-lg">Matchmaking</div>
          <p className="text-sm text-[var(--pcr-muted)]">
            Post a challenge, or accept one from another squad.
          </p>
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-lg border border-[var(--pcr-border)] p-4 no-underline hover:border-[var(--pcr-accent-strong)] transition-colors"
        >
          <div className="font-display text-lg">Leaderboards</div>
          <p className="text-sm text-[var(--pcr-muted)]">
            Overall and per-mode ladders, 2v2 up to 11v11.
          </p>
        </Link>
        <Link
          href="/profile"
          className="rounded-lg border border-[var(--pcr-border)] p-4 no-underline hover:border-[var(--pcr-accent-strong)] transition-colors"
        >
          <div className="font-display text-lg">Individual</div>
          <p className="text-sm text-[var(--pcr-muted)]">
            Your own stats across every match you&apos;ve logged.
          </p>
        </Link>
        <Link
          href="/about"
          className="rounded-lg border border-[var(--pcr-border)] p-4 no-underline hover:border-[var(--pcr-accent-strong)] transition-colors"
        >
          <div className="font-display text-lg">About Us</div>
          <p className="text-sm text-[var(--pcr-muted)]">
            What Clubs Ranked is, and what&apos;s coming next.
          </p>
        </Link>
      </div>
    </div>
  );
}

async function SquadDashboard({ squadId }: { squadId: string }) {
  const squad = await getSquadById(squadId);
  if (!squad) return null;

  const matches = await getRecentMatchesForSquad(squadId);

  return (
    <div className="rounded-lg border border-[var(--pcr-border)] p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link
            href={`/squad/${squad.id}`}
            className="font-display text-2xl no-underline hover:text-[var(--pcr-accent-strong)]"
          >
            {squad.name}
          </Link>
          <p className="text-sm text-[var(--pcr-muted)]">
            {squad.platform?.toUpperCase() ?? "—"} · {squad.region ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono-stat text-xl">{squad.xp} XP</span>
          <TierBadge xp={squad.xp} />
        </div>
      </div>

      {matches.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-[family-name:var(--font-mono)] uppercase tracking-wide text-[var(--pcr-muted)] mb-2">
            Recent matches
          </h3>
          <ul className="space-y-1">
            {matches.slice(0, 5).map((m) => (
              <li key={m.id} className="text-sm">
                <Link href={`/matches/${m.id}`} className="no-underline">
                  {m.size} —{" "}
                  {m.status === "confirmed"
                    ? "Confirmed"
                    : m.status === "disputed"
                      ? "Disputed"
                      : "Pending"}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
