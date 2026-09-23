# Clubs Ranked

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
**Already have a Clubs Ranked project from before this challenge-board/stats
update?** Run `supabase/migration_002_challenges_and_stats.sql`, then
`supabase/migration_003_ea_link.sql`, then
`supabase/migration_004_mode_leaderboards.sql` — see "Updating an existing
project" below. (Already ran 002 and 003? Just run 004.)

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

After that, also run `supabase/migration_003_ea_link.sql` — it just adds a
few nullable columns (`profiles.ea_persona_name`,
`squads.ea_club_id`/`ea_platform`) used by the experimental EA stats
auto-import described below. Safe to run any time, touches no existing
data.

Then run `supabase/migration_004_mode_leaderboards.sql` for the per-mode
leaderboards. It adds a `squad_mode_stats` table (XP / wins / losses per
squad per size), a `matches.xp_awarded` flag, and an `award_match_xp()`
database function that now does all XP awarding in one transaction. It
also backfills per-mode stats from every match already confirmed, without
changing anyone's existing overall XP. Safe to run more than once.

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
- **Per-mode leaderboards.** `/leaderboard` has an Overall tab (the
  original `squads.xp` ladder) plus one tab per size (`?mode=5v5` etc.),
  backed by `squad_mode_stats`. Each squad page shows its record in every
  size it has played. Tiers on a mode tab use that mode's XP. XP for both
  ladders is awarded only by the `award_match_xp()` SECURITY DEFINER
  function, which can't pay out twice for one match (it flips
  `matches.xp_awarded` first) and is the only way to write
  `squad_mode_stats`. The broad "any authenticated user can update a
  squad" policy on `squads` is no longer needed for XP and could now be
  tightened to captain-only, but hasn't been yet.
- **Player stat fields are a placeholder set.** `player_match_stats`
  stores `goals`, `assists`, and `motm` in a jsonb column on purpose — the
  founder is expected to send a fuller list of stat fields later, and
  adding more will just mean writing more keys into that jsonb blob, not a
  schema migration. Don't read too much into which three fields shipped
  first.
- **EA stats auto-import is experimental groundwork only — see below.**
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

## EA stats auto-import (experimental)

There is no official, documented EA API for Pro Clubs. Every Discord stats
bot and stat-tracking site out there (the kind of bot referenced when this
feature was requested) works by calling the same undocumented endpoints
EA's own web app uses internally, under `proclubs.ea.com`. This repo now
has the groundwork to do the same thing, laid out but **not turned on**:

- `supabase/migration_003_ea_link.sql` adds `profiles.ea_persona_name`
  (a player's exact PSN/Xbox gamertag/EA ID) and
  `squads.ea_club_id`/`ea_platform` (which EA club a squad corresponds
  to).
- The `/profile` page lets a player save their own persona name.
- The `/squad/[id]` page has a captain-only panel to save a squad's EA
  club ID/platform, plus a "Preview EA sync" button that calls
  `/api/ea/sync-preview` and shows the raw JSON EA returns for that club's
  recent matches — for inspecting the real response shape, not for
  populating anything.
- `src/lib/ea.ts` is the actual client code, with the two endpoints found
  in public write-ups: club search (`/allTimeLeaderboard/search`) and club
  match history (`/clubs/matches`).

**Why it stops at "preview" and doesn't auto-fill `player_match_stats`
yet:** this was written and tested from an environment with no network
route to `proclubs.ea.com`, so the response shape in `src/lib/ea.ts` is a
best guess from community documentation, not a verified contract. Before
building an auto-fill pipeline on top of it:

1. Deploy this (Vercel has normal internet access) and use the "Preview
   EA sync" button on a squad linked to a real EA club to see an actual
   response.
2. Check the field names in that response against the guesses in
   `src/lib/ea.ts` (`EaClubMatch`, `EaClubSearchResult`) and adjust them.
3. Only then wire a real sync into `player_match_stats` — and keep manual
   entry as the fallback regardless, since these endpoints have gone down
   for extended periods before (weeks, on EA's side) with no
   communication from EA.

Treat this entire feature as "nice to have, never load-bearing" — self-
reported stats are what the leaderboard actually runs on.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- [Supabase](https://supabase.com) for auth (email/password) and Postgres
  (via `@supabase/supabase-js` + `@supabase/ssr` — not the deprecated
  `@supabase/auth-helpers-nextjs`)
- Deployed on [Vercel](https://vercel.com)

No other backend services are used.
