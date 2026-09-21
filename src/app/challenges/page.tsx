import Link from "next/link";
import { getCurrentUser, getSquadForUser, getOpenMatchPosts } from "@/lib/data";
import ChallengeBoardTable from "./ChallengeBoardTable";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const current = await getCurrentUser();
  // The proxy (src/proxy.ts) already redirects logged-out users to /login
  // before this ever renders, but guard anyway in case it's ever reached
  // directly during dev.
  if (!current) {
    return <p className="text-[var(--pcr-muted)]">You need to be logged in.</p>;
  }

  const [squadInfo, posts] = await Promise.all([
    getSquadForUser(current.user.id),
    getOpenMatchPosts(),
  ]);

  if (!squadInfo) {
    return (
      <div className="rounded-lg border border-[var(--pcr-border)] bg-[var(--pcr-bg-elevated)] p-6 text-center max-w-md mx-auto">
        <p className="mb-4">You need a squad before you can post or accept a match.</p>
        <Link
          href="/squad/new"
          className="inline-block rounded-md bg-[var(--pcr-accent-strong)] text-[var(--pcr-accent-strong-fg)] font-medium px-5 py-2.5 no-underline hover:opacity-90 transition-opacity"
        >
          Create a squad
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl">Find a Match</h1>
          <p className="text-sm text-[var(--pcr-muted)]">
            Open challenges from other squads — accept one, or post your own.
          </p>
        </div>
        <Link
          href="/challenges/new"
          className="rounded-md bg-[var(--pcr-accent-strong)] text-[var(--pcr-accent-strong-fg)] font-medium px-4 py-2 text-sm no-underline hover:opacity-90 transition-opacity"
        >
          Post a match
        </Link>
      </div>

      <ChallengeBoardTable posts={posts} ownSquadId={squadInfo.squad.id} />
    </div>
  );
}
