export const metadata = {
  title: "About — Pro Clubs Ranked",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl mb-6">About Us</h1>

      <div className="space-y-6 text-sm leading-relaxed text-[var(--pcr-fg)]">
        <p>
          Pro Clubs Ranked is a matchmaking and XP ladder site built
          specifically for EA FC Pro Clubs. It exists because getting an
          organized club match — at whatever squad size you actually have
          on a given night — usually means posting in a Discord server and
          hoping someone bites. We wanted a simple, dedicated board for
          that instead.
        </p>

        <section>
          <h2 className="font-display text-lg mb-2">What it&apos;s built on</h2>
          <p className="mb-3">There are three pillars to the site:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong className="text-[var(--pcr-fg)]">Matchmaking.</strong>{" "}
              Post your squad up for a match at any size — 2v2 all the way
              to full 11v11 — and other squads can accept it directly.
              No ranked queue, no waiting on a lobby to fill; it&apos;s a
              post-and-accept board.
            </li>
            <li>
              <strong className="text-[var(--pcr-fg)]">A free XP ladder.</strong>{" "}
              Confirmed results earn your squad XP and move you up the{" "}
              <span className="font-mono-stat text-xs">Bronze / Silver / Gold / Elite</span>{" "}
              tiers on the leaderboard. This part is, and will stay, free —
              no entry fee, no wagering.
            </li>
            <li>
              <strong className="text-[var(--pcr-fg)]">No cash or wagering.</strong>{" "}
              There are no cash prizes, paid entry, or wagering features on
              Pro Clubs Ranked, and none are planned without a proper legal
              review of UK gambling law first. Everything on the site is
              free to play.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Individual stats</h2>
          <p>
            Squads aren&apos;t the whole story — Pro Clubs is still a game
            of individual performances. Every player can log their own
            goals, assists, and man-of-the-match awards for matches
            they&apos;ve played, and see it totalled up on their own{" "}
            <span className="font-mono-stat text-xs">Individual</span> page.
            A dedicated Top Pros ranking, spanning every squad rather than
            just your own, is planned but not built yet.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Known limitations, for now</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Each account can belong to <strong className="text-[var(--pcr-fg)]">one squad</strong> at
              a time — invite/remove flows for bigger 11-a-side rosters are
              on the roadmap, not built yet.
            </li>
            <li>
              If two squads report different results for the same match,
              it&apos;s marked <strong className="text-[var(--pcr-fg)]">disputed</strong> and there&apos;s no
              admin override or vote yet — either squad can re-report to
              correct a mistake, which can resolve it, but nothing forces
              that to happen.
            </li>
          </ul>
        </section>

        <p className="text-xs text-[var(--pcr-muted)]">
          This is an early build — expect rough edges, and features that
          arrive roughly in the order above. Found a bug, or hit a dispute
          that won&apos;t resolve? Email{" "}
          <a href="mailto:support@clubsranked.co.uk">support@clubsranked.co.uk</a>.
        </p>
      </div>
    </div>
  );
}
