import { getCurrentUser, getPlayerStatsForUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const current = await getCurrentUser();
  // The proxy (src/proxy.ts) already redirects logged-out users to /login
  // before this ever renders, but guard anyway in case it's ever reached
  // directly during dev (same pattern as /challenges).
  if (!current) {
    return <p className="text-[var(--pcr-muted)]">You need to be logged in.</p>;
  }

  const totals = await getPlayerStatsForUser(current.user.id);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl mb-1">
        {current.profile?.username ?? "Your"} stats
      </h1>
      <p className="text-sm text-[var(--pcr-muted)] mb-6">
        Your own totals across every match you&apos;ve logged stats for,
        across any squad — not just one club.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Goals" value={totals.goals} />
        <StatTile label="Assists" value={totals.assists} />
        <StatTile label="MOTM" value={totals.motm} />
        <StatTile label="Matches logged" value={totals.matchesLogged} />
      </div>

      {totals.matchesLogged === 0 && (
        <p className="mt-6 text-sm text-[var(--pcr-muted)]">
          No stats logged yet. Once a match you&apos;ve played is confirmed,
          you can log your own goals, assists, and MOTM from its match page.
        </p>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--pcr-border)] bg-[var(--pcr-bg-elevated)] p-4 text-center">
      <div className="font-mono-stat text-2xl">{value}</div>
      <div className="text-xs font-[family-name:var(--font-mono)] uppercase tracking-wide text-[var(--pcr-muted)] mt-1">
        {label}
      </div>
    </div>
  );
}
