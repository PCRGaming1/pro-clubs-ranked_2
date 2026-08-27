import Link from "next/link";
import { getCurrentUser, getSquadForUser } from "@/lib/data";
import NewPostForm from "./NewPostForm";

export const dynamic = "force-dynamic";

export default async function NewChallengePage() {
  const current = await getCurrentUser();
  if (!current) {
    return <p className="text-[var(--pcr-muted)]">You need to be logged in.</p>;
  }

  const squadInfo = await getSquadForUser(current.user.id);

  if (!squadInfo) {
    return (
      <div className="rounded-lg border border-[var(--pcr-border)] bg-[var(--pcr-bg-elevated)] p-6 text-center max-w-md mx-auto">
        <p className="mb-4">You need a squad before you can post a match.</p>
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
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-1">Post a match</h1>
      <p className="text-sm text-[var(--pcr-muted)] mb-6">
        Posting as <strong className="text-[var(--pcr-fg)]">{squadInfo.squad.name}</strong> (
        {squadInfo.squad.platform?.toUpperCase() ?? "—"} · {squadInfo.squad.region ?? "—"}). It
        will sit on the board until another squad accepts it, or you cancel it.
      </p>
      <NewPostForm squadId={squadInfo.squad.id} />
    </div>
  );
}
