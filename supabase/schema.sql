-- Pro Clubs Ranked (PCR) — MVP schema
--
-- =============================================================================
-- IMPORTANT: these are STARTER Row Level Security policies for an early MVP.
-- They aim to be "reasonable and not wide open," not audited or complete.
-- A security review (Sept 2026, see SECURITY_REVIEW.md) tightened the three
-- broad "any authenticated user can update this row" policies below to lock
-- every column the app doesn't actually need to write — see the comment on
-- each one. The remaining known gap is `squads.xp`, which stays writable by
-- any authenticated user pending a SECURITY DEFINER rewrite of XP awarding.
-- Before real users and real accounts depend on this, also review:
--   - the match_posts / matches / match_reports policies for abuse
--     potential (e.g. a user spamming posts, accepting posts they
--     shouldn't be able to, or reporting bogus results for matches they
--     aren't really part of),
--   - whether squad membership changes (kicks, leaves, captaincy transfer)
--     need their own policies (none exist yet — there's no UI for them),
--   - rate limiting / anti-abuse, which Postgres RLS does not give you.
--
-- Why match_posts / match_reports / player_match_stats need similarly
-- permissive policies to the old queue_entries table: there's no
-- service-role key available client-side (see .env.local.example — only
-- the anon key is used), so every API route runs as the requesting user,
-- not as an admin. That means routes which have to touch a row belonging
-- to squad they aren't a member of (accepting someone else's match post,
-- confirming a match both squads are in) need a broader "any authenticated
-- user can update" policy rather than a strict "only your own row" one.
-- match_reports and player_match_stats are the exception — those tables
-- are structured so every write really is to the acting user's own row
-- (one report row per squad you belong to, one stats row per player per
-- match), so they get tighter ownership-based policies instead. See the
-- comments on each table below for specifics.
-- =============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  platform text check (platform in ('ps','xbox','pc')),
  region text,
  created_at timestamptz not null default now(),
  -- EA persona name (PSN/Xbox gamertag/EA ID) — groundwork for the
  -- experimental EA stats auto-import, see README. Not used yet.
  ea_persona_name text
);

alter table public.profiles enable row level security;

create policy "profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "a user can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "a user can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
-- (Alternative approach: skip this trigger and have the app insert the
-- profile row itself right after signup — this repo does BOTH, so signup
-- works whether or not you've run this trigger. If you run this trigger,
-- the app-side insert below becomes a harmless no-op on conflict.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- squads
-- -----------------------------------------------------------------------------
create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  captain_id uuid references public.profiles(id),
  platform text,
  region text,
  xp int not null default 0,
  created_at timestamptz not null default now(),
  -- EA club link — groundwork for the experimental EA stats auto-import,
  -- see README and supabase/migration_003_ea_link.sql. Not used yet.
  ea_club_id text,
  ea_platform text
);

alter table public.squads enable row level security;

create policy "squads are readable by any authenticated user"
  on public.squads for select
  to authenticated
  using (true);

create policy "a user can create a squad naming themselves captain"
  on public.squads for insert
  to authenticated
  with check (auth.uid() = captain_id);

-- NOTE: this is broader than "only the captain can edit their own squad."
-- /api/matches/[id]/report has to award XP to BOTH squads in a match —
-- including the squad the reporting user is NOT a captain (or even a
-- member) of. As with match_posts below, there's no service-role key in
-- this app, so this runs as the requesting user.
--
-- What IS enforced at the database layer (as of migration 004): the WITH
-- CHECK below locks name / captain_id / platform / region to their
-- existing values, since no app code ever changes those via UPDATE (see
-- SECURITY_REVIEW.md). Only xp, ea_club_id, and ea_platform stay freely
-- writable by any authenticated user. xp specifically is still an
-- accepted MVP gap: a malicious user could in theory grant a squad XP it
-- didn't earn. Before real competitive stakes ride on the ladder, move XP
-- awards into a SECURITY DEFINER Postgres function that only touches the
-- xp column, gated on real match participation, rather than trusting the
-- requesting client.
create policy "any authenticated user can update a squad's mutable fields"
  on public.squads for update
  to authenticated
  using (true)
  with check (
    name = (select s.name from public.squads s where s.id = squads.id)
    and captain_id is not distinct from (select s.captain_id from public.squads s where s.id = squads.id)
    and platform is not distinct from (select s.platform from public.squads s where s.id = squads.id)
    and region is not distinct from (select s.region from public.squads s where s.id = squads.id)
  );

-- -----------------------------------------------------------------------------
-- squad_members
-- -----------------------------------------------------------------------------
create table if not exists public.squad_members (
  squad_id uuid references public.squads(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member',
  primary key (squad_id, user_id)
);

alter table public.squad_members enable row level security;

create policy "squad membership is readable by any authenticated user"
  on public.squad_members for select
  to authenticated
  using (true);

create policy "a user can add themself to a squad they are joining"
  on public.squad_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "a user can remove themself from a squad"
  on public.squad_members for delete
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- matches
-- -----------------------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  size text,
  platform text,
  region text,
  squad_a_id uuid references public.squads(id),
  squad_b_id uuid references public.squads(id),
  status text not null default 'pending' check (status in ('pending','confirmed','disputed')),
  winner_squad_id uuid references public.squads(id),
  -- Legacy column from the old "first report wins" flow. No longer
  -- written by the app — see match_reports.reported_by below, which
  -- tracks who reported on behalf of each squad individually. Kept here
  -- (rather than dropped) so this file matches what
  -- migration_002_challenges_and_stats.sql leaves an existing database
  -- with, which does not touch the matches table's columns.
  reported_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.matches enable row level security;

create policy "matches are readable by any authenticated user"
  on public.matches for select
  to authenticated
  using (true);

-- Match rows are created by server-side API routes using the same
-- authenticated user context, on behalf of a member of one of the two
-- squads being matched (via a posted-and-accepted challenge).
create policy "a member of either squad can insert a match"
  on public.matches for insert
  to authenticated
  with check (
    exists (
      select 1 from public.squad_members sm
      where sm.user_id = auth.uid()
        and sm.squad_id in (matches.squad_a_id, matches.squad_b_id)
    )
  );

-- As of migration 004, the WITH CHECK also locks squad_a_id / squad_b_id /
-- size / platform / region / created_at to their existing values — only
-- status and winner_squad_id (plus the unused legacy reported_by column)
-- are ever written via UPDATE by app code (see SECURITY_REVIEW.md).
create policy "a member of either squad can report a match's result"
  on public.matches for update
  to authenticated
  using (
    exists (
      select 1 from public.squad_members sm
      where sm.user_id = auth.uid()
        and sm.squad_id in (matches.squad_a_id, matches.squad_b_id)
    )
  )
  with check (
    exists (
      select 1 from public.squad_members sm
      where sm.user_id = auth.uid()
        and sm.squad_id in (matches.squad_a_id, matches.squad_b_id)
    )
    and squad_a_id = (select m.squad_a_id from public.matches m where m.id = matches.id)
    and squad_b_id is not distinct from (select m.squad_b_id from public.matches m where m.id = matches.id)
    and size is not distinct from (select m.size from public.matches m where m.id = matches.id)
    and platform is not distinct from (select m.platform from public.matches m where m.id = matches.id)
    and region is not distinct from (select m.region from public.matches m where m.id = matches.id)
    and created_at = (select m.created_at from public.matches m where m.id = matches.id)
  );

-- -----------------------------------------------------------------------------
-- match_posts — the "challenge board": a squad posts an open request for a
-- match, which sits visible until another squad accepts it (or the poster
-- cancels it). Replaces the old queue_entries auto-matchmaking table.
-- -----------------------------------------------------------------------------
create table if not exists public.match_posts (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid references public.squads(id),
  size text not null,
  platform text,
  region text,
  note text,
  status text not null default 'open' check (status in ('open','accepted','cancelled')),
  accepted_by_squad_id uuid references public.squads(id),
  match_id uuid references public.matches(id),
  created_at timestamptz not null default now()
);

alter table public.match_posts enable row level security;

create policy "match posts are readable by any authenticated user"
  on public.match_posts for select
  to authenticated
  using (true);

create policy "a member of a squad can post a challenge for that squad"
  on public.match_posts for insert
  to authenticated
  with check (
    exists (
      select 1 from public.squad_members sm
      where sm.squad_id = match_posts.squad_id
        and sm.user_id = auth.uid()
    )
  );

-- NOTE: intentionally broader than "only your own post." /api/posts/[id]/accept
-- has to flip a DIFFERENT squad's post from 'open' to 'accepted' (setting
-- accepted_by_squad_id and match_id) — the accepting user is never a
-- member of the poster's squad. Same MVP trade-off as queue_entries had:
-- no service-role key here, so allow any authenticated user to update a
-- match_posts row, but (as of migration 004) lock every column except
-- status / accepted_by_squad_id / match_id to its existing value — those
-- three are the only ones any app code ever writes via UPDATE (accept and
-- cancel; see SECURITY_REVIEW.md). The app's atomic
-- `UPDATE ... WHERE status = 'open'` (see that route) still does the
-- accept-locking/self-cancel race safety on top of this.
create policy "any authenticated user can progress a match post's status"
  on public.match_posts for update
  to authenticated
  using (true)
  with check (
    squad_id = (select mp.squad_id from public.match_posts mp where mp.id = match_posts.id)
    and size = (select mp.size from public.match_posts mp where mp.id = match_posts.id)
    and platform is not distinct from (select mp.platform from public.match_posts mp where mp.id = match_posts.id)
    and region is not distinct from (select mp.region from public.match_posts mp where mp.id = match_posts.id)
    and note is not distinct from (select mp.note from public.match_posts mp where mp.id = match_posts.id)
    and created_at = (select mp.created_at from public.match_posts mp where mp.id = match_posts.id)
  );

-- -----------------------------------------------------------------------------
-- match_reports — each squad's claimed winner for a match. Both squads
-- must report and agree before /api/matches/[id]/report confirms the match
-- and awards XP; disagreement marks the match 'disputed' instead.
-- Replaces the old "first report wins" flow (matches.reported_by).
-- -----------------------------------------------------------------------------
create table if not exists public.match_reports (
  match_id uuid references public.matches(id),
  squad_id uuid references public.squads(id),
  winner_squad_id uuid references public.squads(id),
  reported_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (match_id, squad_id)
);

alter table public.match_reports enable row level security;

-- Unlike match_posts, every write here really is "the acting user's own
-- row" (one row per squad they belong to), so this can stay a strict
-- ownership policy instead of the broad "any authenticated user" pattern
-- used above.
create policy "match reports are readable by any authenticated user"
  on public.match_reports for select
  to authenticated
  using (true);

create policy "a member of the squad can report their own match claim"
  on public.match_reports for insert
  to authenticated
  with check (
    reported_by = auth.uid()
    and exists (
      select 1 from public.squad_members sm
      where sm.squad_id = match_reports.squad_id
        and sm.user_id = auth.uid()
    )
    and exists (
      select 1 from public.matches m
      where m.id = match_reports.match_id
        and match_reports.squad_id in (m.squad_a_id, m.squad_b_id)
    )
  );

create policy "a member of the squad can update their own match claim"
  on public.match_reports for update
  to authenticated
  using (
    exists (
      select 1 from public.squad_members sm
      where sm.squad_id = match_reports.squad_id
        and sm.user_id = auth.uid()
    )
  )
  with check (
    reported_by = auth.uid()
    and exists (
      select 1 from public.squad_members sm
      where sm.squad_id = match_reports.squad_id
        and sm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- player_match_stats — a player's own logged stats for one confirmed
-- match. `stats` is jsonb and intentionally open-ended: the current app
-- only writes {goals, assists, motm}, a small starter set pending a fuller
-- field list. See src/app/api/matches/[id]/stats/route.ts.
-- -----------------------------------------------------------------------------
create table if not exists public.player_match_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id),
  user_id uuid references public.profiles(id),
  squad_id uuid references public.squads(id),
  stats jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (match_id, user_id)
);

alter table public.player_match_stats enable row level security;

create policy "player match stats are readable by any authenticated user"
  on public.player_match_stats for select
  to authenticated
  using (true);

-- Every write here is to the acting user's own row (one per player per
-- match), so — like match_reports — this stays a strict ownership policy.
create policy "a player can log their own stats for a confirmed match they were in"
  on public.player_match_stats for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.squad_members sm
      where sm.squad_id = player_match_stats.squad_id
        and sm.user_id = auth.uid()
    )
    and exists (
      select 1 from public.matches m
      where m.id = player_match_stats.match_id
        and m.status = 'confirmed'
        and player_match_stats.squad_id in (m.squad_a_id, m.squad_b_id)
    )
  );

create policy "a player can update their own logged stats"
  on public.player_match_stats for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
