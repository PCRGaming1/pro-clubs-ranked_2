-- Pro Clubs Ranked (PCR) — MVP schema
--
-- =============================================================================
-- IMPORTANT: these are STARTER Row Level Security policies for an early MVP.
-- They aim to be "reasonable and not wide open," not audited or complete.
-- Before real users and real accounts depend on this, have someone review:
--   - the queue_entries / matches policies for abuse potential (e.g. a user
--     spamming queue joins, or reporting bogus results for matches they
--     aren't really part of),
--   - whether squad membership changes (kicks, leaves, captaincy transfer)
--     need their own policies (none exist yet — there's no UI for them),
--   - rate limiting / anti-abuse, which Postgres RLS does not give you.
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
  created_at timestamptz not null default now()
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
  created_at timestamptz not null default now()
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
-- member) of. As with queue_entries above, there's no service-role key in
-- this app, so this runs as the requesting user. Plain RLS policies can't
-- easily express "anyone can change the xp column, but only the captain
-- can change name/platform/region" (that needs column-level privileges or
-- a trigger). For the MVP, allow any authenticated user to update a
-- squads row and rely on the app code (not the database) to only ever
-- change `xp` on someone else's squad. Before real users depend on this,
-- move XP awards into a SECURITY DEFINER Postgres function that only
-- touches the xp column, and go back to a captain-only policy for
-- everything else.
create policy "any authenticated user can update a squad"
  on public.squads for update
  to authenticated
  using (true)
  with check (true);

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
-- queue_entries
-- -----------------------------------------------------------------------------
create table if not exists public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid references public.squads(id),
  size text not null,
  platform text,
  region text,
  status text not null default 'waiting' check (status in ('waiting','matched','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.queue_entries enable row level security;

create policy "queue entries are readable by any authenticated user"
  on public.queue_entries for select
  to authenticated
  using (true);

create policy "a member of a squad can queue that squad"
  on public.queue_entries for insert
  to authenticated
  with check (
    exists (
      select 1 from public.squad_members sm
      where sm.squad_id = queue_entries.squad_id
        and sm.user_id = auth.uid()
    )
  );

-- NOTE: this is intentionally broader than "only your own squad's entry."
-- /api/queue/join has to mark BOTH sides of a match as 'matched' —
-- including the opponent squad's entry, which the requesting user is not
-- a member of. There's no service-role key in this app (see
-- .env.local.example — only the anon key is used), so the match-making
-- route runs as the requesting user, not as an admin. Since queue_entries
-- rows don't hold sensitive data (they're already readable by any
-- authenticated user via the select policy above), letting any
-- authenticated user update a queue_entries row's status is a reasonable
-- MVP trade-off. Tighten this (e.g. move matchmaking into a
-- SECURITY DEFINER Postgres function) before this matters for abuse
-- resistance.
create policy "any authenticated user can update a queue entry's status"
  on public.queue_entries for update
  to authenticated
  using (true)
  with check (true);

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
  status text not null default 'pending' check (status in ('pending','confirmed')),
  winner_squad_id uuid references public.squads(id),
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
-- squads being queued/matched.
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

create policy "a member of either squad can update a match to report a result"
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
  );
