# Pro Clubs Ranked (PCR)

A matchmaking + XP ladder web app for EA FC Pro Clubs (11-a-side club mode).
Players create a squad, queue up for a match at a given size (2v2 up to
11v11), get paired against another squad, and report the result to climb
an XP-based tier ladder (Bronze / Silver / Gold / Elite).

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

1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Open `supabase/schema.sql` from this repo, copy its entire contents,
   and paste it into a new SQL Editor query.
3. Click **Run**. This creates all five tables (`profiles`, `squads`,
   `squad_members`, `queue_entries`, `matches`), turns on Row Level
   Security with starter access policies, and sets up a trigger that
   automatically creates a `profiles` row whenever someone signs up.

   Read the comment block at the top of `schema.sql` — the RLS policies
   are a reasonable starting point for an MVP, not an audited security
   model. Have someone review them before you have real users.

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
   account, create a squad, and try the queue with a second account in
   another browser (or an incognito window) to see matchmaking work.

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
- **Match results are first-report-wins.** Whichever squad reports a
  result first sets it; there's no confirmation step from the other squad
  and no dispute/admin-override flow. A real version needs both squads to
  confirm a result (or an admin override) before XP is awarded.
- **Matchmaking has a known race condition.** `/api/queue/join` reads
  "is there a waiting opponent?" and then writes a match in two separate
  steps, not inside a single atomic transaction. Two squads joining the
  same queue (same size/platform/region) at almost the same instant could
  in theory both match against the same opponent, or both end up waiting
  when one should have matched the other. A production version should do
  this inside a Postgres function (RPC) using row locking
  (`SELECT ... FOR UPDATE SKIP LOCKED` or similar) so the whole "find
  opponent, create match, mark entries matched" sequence is atomic. The
  simple version is what's shipped here.
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
