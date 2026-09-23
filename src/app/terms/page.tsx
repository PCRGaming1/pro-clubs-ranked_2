export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl mb-2">Terms of Service</h1>
      <p className="text-xs text-[var(--pcr-muted)] mb-6">Last updated: September 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-[var(--pcr-fg)]">
        <p>
          These terms cover your use of Clubs Ranked (&quot;CR&quot;,
          &quot;we&quot;, &quot;us&quot;). By creating an account, you agree
          to them. If you don&apos;t agree, please don&apos;t use the site.
        </p>

        <section>
          <h2 className="font-display text-lg mb-2">What Clubs Ranked is</h2>
          <p>
            A free matchmaking board and XP ladder for EA FC Pro Clubs. You
            post your squad up for a match, another squad accepts it, and
            once both squads agree on the result, XP is awarded and your
            squad&apos;s rank updates. There are{" "}
            <strong className="text-[var(--pcr-fg)]">no cash prizes, paid entry, or
            wagering features</strong>, and none are planned unless and until
            UK gambling law is reviewed for anything that might resemble a
            wager between players.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Your account</h2>
          <p>
            You&apos;re responsible for keeping your login details secure and
            for anything that happens under your account. Give us accurate
            info when you sign up. One account per person — don&apos;t create
            multiple accounts to game the ladder or the matchmaking board.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Match results and disputes</h2>
          <p>
            Match results are self-reported by the squads involved — we
            don&apos;t independently verify them. If both squads&apos;
            reports agree, the match is confirmed and XP is awarded. If they
            disagree, the match is marked disputed; either squad can
            re-report to correct a mistake, but we don&apos;t currently
            operate an admin review or voting process for disputes that
            don&apos;t resolve that way. Don&apos;t submit false results —
            accounts found doing so may be suspended.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Acceptable use</h2>
          <p>
            Play fair and treat other players decently. We can suspend or
            terminate accounts for cheating, harassment, abusive behavior
            toward other players, attempting to exploit or disrupt the site,
            or submitting knowingly false match results or stats.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">The service is provided &quot;as is&quot;</h2>
          <p>
            Clubs Ranked is an early-stage, actively-developed site.
            We make no guarantee it will be available at all times, free of
            bugs, or that any particular feature will stay exactly as it is.
            To the fullest extent the law allows, we&apos;re not liable for
            losses arising from your use of the site, including lost XP,
            rank changes, or disputes between squads that don&apos;t get
            resolved.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">EA trademark disclaimer</h2>
          <p>
            Clubs Ranked is an independent, fan-built site and is not
            affiliated with, endorsed by, or sponsored by Electronic Arts
            Inc. &quot;Pro Clubs&quot; and &quot;EA FC&quot; are trademarks
            of Electronic Arts Inc.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Changes</h2>
          <p>
            We may update these terms as the site develops. Material changes
            will update the date at the top of this page.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Governing law</h2>
          <p>These terms are governed by the laws of England and Wales.</p>
        </section>

        <p className="text-xs text-[var(--pcr-muted)]">
          Questions? Email{" "}
          <a href="mailto:support@clubsranked.co.uk">support@clubsranked.co.uk</a>.
        </p>
      </div>
    </div>
  );
}
