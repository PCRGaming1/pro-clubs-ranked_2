-- Pro Clubs Ranked (PCR) — migration 002
--
-- Run this in the SQL Editor of an EXISTING Supabase project that already
-- has the old schema applied (profiles, squads, squad_members,
-- queue_entries, matches with real data in them). This file only adds
-- what's new and removes what's no longer used — it does NOT touch or
-- delete any rows in profiles, squads, or matches.
--
-- What this does:
--   1. Widens matches.status to allow 'disputed' (needed for the new
--      "both squads must confirm" report flow).
--   2. Creates three new tables: match_posts, match_reports,
--      player_match_stats — plus their RLS policies.
--   3. Drops the old queue_entries table. This DELETES any rows currently
--      in queue_entries (i.e. any test queue entries you have) — nothing
--      else. It does not touch profiles, squads, squad_members, or
--      matches.
--
-- Safe to run more than once — every statement below is written to be
-- idempotent (IF NOT EXISTS / IF EXISTS / DROP POLICY before CREATE).
--
-- See supabase/schema.sql for the full current-state schema (what you'd
-- run on a brand-new project instead of this file), and its top-of-file
-- comment block for the RLS reasoning referenced below.

-- Needed for gen_random_uuid(), in case it isn't already enabled.
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. matches.status: allow 'disputed'
-- -----------------------------------------------------------------------------
-- Postgres names a column check constraint "<table>_<column>_check" by
-- default, which is what `create table ... check (...)` in the original
-- schema.sql produced. Drop and recreate it with the wider list of
-- allowed values. This does not touch any existing row's data — every
-- existing matches.status value ('pending' or 'confirmed') is still valid
-- under the new constraint.
alter table public.matches drop constraint if exists matches_status_check;
alter table public.matches add constraint matches_status_check
  check (status in ('pending','confirmed','disputed'));

-- -----------------------------------------------------------------------------
-- 2. match_posts — the challenge board, replacing queue_entries.
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

drop policy if exists "match posts are readable by any authenticated user" on public.match_posts;
create policy "match posts are readable by any authenticated user"
  on public.match_posts for select
  to authenticated
  using (true);

drop policy if exists "a member of a squad can post a challenge for that squad" on public.match_posts;
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

-- See supabase/schema.sql's header comment for why this is intentionally
-- broader than "only your own post" — the accept flow has to update a
-- DIFFERENT squad's post row, and there's no service-role key here.
drop policy if exists "any authenticated user can update a match post" on public.match_posts;
create policy "any authenticated user can update a match post"
  on public.match_posts for update
  to authenticated
  using (true)
  with check (true);

-- -----------------------------------------------------------------------------
-- 3. match_reports — both-squads-must-agree result confirmation,
--    replacing the old first-report-wins flow.
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

drop policy if exists "match reports are readable by any authenticated user" on public.match_reports;
create policy "match reports are readable by any authenticated user"
  on public.match_reports for select
  to authenticated
  using (true);

drop policy if exists "a member of the squad can report their own match claim" on public.match_reports;
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

drop policy if exists "a member of the squad can update their own match claim" on public.match_reports;
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
-- 4. player_match_stats — individual player stats per confirmed match,
--    feeding the squad "Top Pros" leaderboard.
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

drop policy if exists "player match stats are readable by any authenticated user" on public.player_match_stats;
create policy "player match stats are readable by any authenticated user"
  on public.player_match_stats for select
  to authenticated
  using (true);

drop policy if exists "a player can log their own stats for a confirmed match they were in" on public.player_match_stats;
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

drop policy if exists "a player can update their own logged stats" on public.player_match_stats;
create policy "a player can update their own logged stats"
  on public.player_match_stats for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 5. Drop the old auto-matchmaking queue table.
-- -----------------------------------------------------------------------------
-- This DELETES any rows currently in queue_entries (test queue entries
-- from the old matchmaking flow) — that's expected and fine. It does not
-- touch profiles, squads, squad_members, or matches.
drop table if exists public.queue_entries;
