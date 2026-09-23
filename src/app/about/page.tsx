export const metadata = {
  title: "About — Clubs Ranked",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl mb-6">About Us</h1>

      <div className="space-y-6 text-sm leading-relaxed text-[var(--pcr-fg)]">
        <p>
          Clubs Ranked is a matchmaking and XP ladder site built
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
              <strong className="text-[var(--pcr-fg)]">Cash matches — later.</strong>{" "}
              We&apos;d like to offer optional cash matches down the line,
              but UK gambling law has real implications for anything that
              looks like a wager between players, and we&apos;re not
              willing to guess wrong on that. Cash matches are{" "}
              <strong className="text-[var(--pcr-fg)]">not live yet</strong>{" "}
              while we get a straight answer on where the site would sit
              under that law. Until then, everything on Clubs Ranked
              is free to play.
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

        <p className="text-xs text-[var(--pcr-muted)]">
          This is an early build — expect rough edges, and features that
          arrive roughly in the order above.
        </p>
      </div>
    </div>
  );
}
