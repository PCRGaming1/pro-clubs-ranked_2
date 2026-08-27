# Pro Clubs Ranked (PCR)

A matchmaking + XP ladder web app for EA FC Pro Clubs (11-a-side club mode).
Players create a squad, post an open challenge at a given size (2v2 up to
11v11) on the challenge board, get accepted by another squad, and report
the result — once both squads agree — to climb an XP-based tier ladder
(Bronze / Silver / Gold / Elite). Players can also log their own stats
(goals, assists, man of the match) for a confirmed match, feeding a
squad-level "Top Pros" leaderboard.

**There are no cash prizes, wagering, or paid entry features in this app —
that's deliberate.** Real-money matches on a football sim raise UK gambling
law questions that haven't been reviewed yet, so anything payment-related
is out of scope until that review happens.

This guide assumes no prior Supabase or Vercel experience.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier is fine).
2. Click **New project**. Pick any name/password/region.
3. Once it's created, go to **Project Settings -> API**. You'll need two
   values from this page in a minute:
   - **Project URL**
   - **anon public** API key

## 2. Set up the database

**Setting up a brand-new Supabase project?** Use `supabase/schema.sql`.
**Already have a PCR project from before this challenge-board/stats
update?** Use `supabase/migration_002_challenges_and_stats.sql` instead —
see "Updating an existing project" below.

1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Open `supabase/schema.sql` from this repo, copy its entire contents,
   and paste it into a new SQL Editor query.
3. Click **Run**. This creates all seven tables (`profiles`, `squads`,
   `squad_members`, `matches`, `match_posts`, `match_reports`,
   `player_match_stats`), turns on Row Level Security with starter access
   policies, and sets up a trigger that automatically creates a `profiles`
   row whenever someone signs up.

   Read the comment block at the top of `schema.sql` — the RLS policies
   are a reasonable starting point for an MVP, not an audited security
   model. Have someone review them before you have real users.

### Updating an existing project

If you already ran the old `schema.sql` against a live Supabase project
and have real squads/matches/accounts in it, don't re-run the full
`schema.sql` — instead open `supabase/migration_002_challenges_and_stats.sql`
and run that. It only adds the new tables (`match_posts`, `match_reports`,
`player_match_stats`) and their RLS policies, widens `matches.status` to
allow `'disputed'`, and drops the old `queue_entries` table (deleting any
test queue entries in it — harmless, but worth knowing). It does not touch
or delete anything in `profiles`, `squads`, `squad_members`, or `matches`.

## 3. Run it locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example env file and fill in your real values from step 1:
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` and paste in your Project URL and anon key.
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000). Sign up for an
   account, create a squad, and post a match on the challenge board with a
   second account in another browser (or an incognito window) to accept it
   and see a match get created.

## 4. Deploy to Vercel

1. Push this repo to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), sign up/log in, and click
   **Add New -> Project**, then import your GitHub repo.
3. In the project's **Environment Variables** settings, add the same two
   variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will build and host it; you'll get a live URL.

---

## Known limitations / next steps

This is a first working MVP, not a finished product. Things that are
intentionally cut or simplified for now:

- **No cash, wagering, or payment features exist, by design.** Pending a
  legal review of UK gambling law as it applies to real-money matches on a
  football sim. Don't add payment features without that review.
- **One squad per user.** The schema (`squad_members`) supports many
  players per squad, but the app currently only lets each account belong
  to one squad and doesn't yet have UI for inviting/removing members.
  Realistically an 11-a-side club needs an invite flow, a way to remove
  players, and captaincy transfer — none of that exists yet.
- **Disputed results have no resolution flow.** Both squads must now
  report a match's result and agree before XP is awarded
  (`/api/matches/[id]/report`); if they disagree, the match is marked
  `disputed` and just sits there — there's no admin override, no
  re-vote, and no auto-resolution. In practice a squad noticing a
  disagreement can re-report to correct its own claim (which can resolve
  the dispute if it was a simple mistake), but nothing forces that to
  happen. A real version needs an actual dispute-resolution flow
  (admin review, evidence upload, majority vote among players — something).
- **The challenge board's accept step is now safe against the old
  matchmaking race condition, and here's why.** The old `/api/queue/join`
  read "is there a waiting opponent?" and then wrote a match in two
  separate steps, so two squads could in theory both match against the
  same opponent. The new flow (`/api/posts/[id]/accept`) instead does a
  single conditional `UPDATE match_posts SET status = 'accepted' ...
  WHERE status = 'open'` — only one concurrent accept call can ever win
  that update, and every other one gets zero affected rows back, which the
  route turns into a clear "this post was already taken" error instead of
  a silent double-match. This doesn't need a database function or row
  locking to be safe; the conditional `WHERE` clause is the whole guard.
- **Player stat fields are a placeholder set.** `player_match_stats`
  stores `goals`, `assists`, and `motm` in a jsonb column on purpose — the
  founder is expected to send a fuller list of stat fields later, and
  adding more will just mean writing more keys into that jsonb blob, not a
  schema migration. Don't read too much into which three fields shipped
  first.
- **Signup and profile creation.** A Postgres trigger
  (`handle_new_user` in `supabase/schema.sql`) creates the `profiles` row
  automatically when someone signs up, using the username passed in at
  signup. If two people race to sign up with the same username, one
  signup will fail with a database error (usernames are unique) — there's
  no friendlier "username taken" check before submission yet.
- **Profile platform/region aren't editable yet.** The `profiles` table
  has `platform`/`region` columns but there's no settings page to set
  them; squads carry their own platform/region instead, which is what
  matchmaking actually uses.
- **RLS policies are starter policies**, written for an early MVP — see
  the comment block at the top of `supabase/schema.sql`.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- [Supabase](https://supabase.com) for auth (email/password) and Postgres
  (via `@supabase/supabase-js` + `@supabase/ssr` — not the deprecated
  `@supabase/auth-helpers-nextjs`)
- Deployed on [Vercel](https://vercel.com)

No other backend services are used.
