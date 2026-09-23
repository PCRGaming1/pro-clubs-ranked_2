export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl mb-2">Privacy Policy</h1>
      <p className="text-xs text-[var(--pcr-muted)] mb-6">Last updated: September 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-[var(--pcr-fg)]">
        <p>
          Clubs Ranked (&quot;CR&quot;, &quot;we&quot;, &quot;us&quot;) is a
          UK-run matchmaking and XP ladder site for EA FC Pro Clubs. This
          policy explains what personal data we collect when you use the
          site, why, and what rights you have over it. It&apos;s written to
          be read by a normal person, not a lawyer — if anything is unclear,
          email{" "}
          <a href="mailto:support@clubsranked.co.uk">support@clubsranked.co.uk</a>{" "}
          and we&apos;ll explain.
        </p>

        <section>
          <h2 className="font-display text-lg mb-2">What we collect</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong className="text-[var(--pcr-fg)]">Account info:</strong> the
              email address and username you sign up with, and your password
              (stored hashed by our authentication provider — we never see it
              in plain text).
            </li>
            <li>
              <strong className="text-[var(--pcr-fg)]">Profile details:</strong> platform
              (PlayStation/Xbox/PC) and region, if you choose to set them.
            </li>
            <li>
              <strong className="text-[var(--pcr-fg)]">Gameplay data you submit:</strong> squads
              you create or join, challenge posts, match results, and any
              stats (goals, assists, man-of-the-match) you log for yourself.
            </li>
            <li>
              <strong className="text-[var(--pcr-fg)]">EA linking (optional):</strong> if
              you choose to link an EA persona name or a squad&apos;s EA club
              ID, we store that so the site can look up public match data
              for that club/persona from EA&apos;s own services.
            </li>
          </ul>
          <p className="mt-3">
            We do not collect payment information — Clubs Ranked has no
            cash prizes, wagering, or paid features, so there&apos;s nothing
            to pay for.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Why we collect it</h2>
          <p>
            Purely to run the site: creating your account, matching you with
            other squads, keeping the leaderboard accurate, and letting you
            see your own stats. We don&apos;t use your data for advertising,
            and we don&apos;t sell it to anyone.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Cookies</h2>
          <p>
            The site uses one essential cookie set by our authentication
            provider (Supabase) to keep you signed in. That&apos;s it — no
            advertising cookies, no third-party analytics or tracking
            scripts.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Who else processes it</h2>
          <p>
            Two infrastructure providers process data on our behalf, strictly
            to host and run the site:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>
              <strong className="text-[var(--pcr-fg)]">Supabase</strong> — our
              database and authentication provider. Your account and
              gameplay data live in a Supabase-hosted Postgres database.
            </li>
            <li>
              <strong className="text-[var(--pcr-fg)]">Vercel</strong> — hosts
              and serves the website itself.
            </li>
          </ul>
          <p className="mt-3">
            Neither is authorized to use your data for their own purposes —
            they process it only to provide hosting/infrastructure to us.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">How long we keep it</h2>
          <p>
            We keep your account and gameplay data for as long as your
            account is active. If you want your account and associated data
            deleted, email{" "}
            <a href="mailto:support@clubsranked.co.uk">support@clubsranked.co.uk</a>{" "}
            and we&apos;ll remove it, aside from anything we&apos;re legally
            required to retain.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Your rights</h2>
          <p>
            Under UK GDPR, you have the right to access the personal data we
            hold about you, ask us to correct it, ask us to delete it, and
            object to or restrict certain processing. To exercise any of
            these, email{" "}
            <a href="mailto:support@clubsranked.co.uk">support@clubsranked.co.uk</a>.
            You also have the right to complain to the UK Information
            Commissioner&apos;s Office (ICO) at{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noreferrer">
              ico.org.uk
            </a>{" "}
            if you think we&apos;ve mishandled your data.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Children</h2>
          <p>
            Clubs Ranked is not directed at children under 13, and we
            don&apos;t knowingly collect data from them.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Changes to this policy</h2>
          <p>
            If this policy changes materially, we&apos;ll update the date at
            the top of this page.
          </p>
        </section>

        <p className="text-xs text-[var(--pcr-muted)]">
          Questions? Email{" "}
          <a href="mailto:support@clubsranked.co.uk">support@clubsranked.co.uk</a>.
        </p>
      </div>
    </div>
  );
}
