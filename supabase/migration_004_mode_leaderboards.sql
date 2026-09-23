-- Clubs Ranked — migration 004: per-mode leaderboards
--
-- Adds a separate XP ladder for every squad size (2v2 ... 11v11) alongside
-- the existing overall ladder (squads.xp).
--
-- What this adds:
--   1. squad_mode_stats — one row per (squad, size): xp, wins, losses.
--   2. matches.xp_awarded — flag so a match's XP can only ever be awarded
--      once, however many times the award function is called.
--   3. award_match_xp(match_id) — SECURITY DEFINER function that awards XP
--      for a confirmed match in one transaction: overall squads.xp AND the
--      per-mode row for the match's size. Replaces the read-then-write XP
--      updates that /api/matches/[id]/report used to do in app code (which
--      could lose an increment if two matches confirmed at the same moment).
--   4. A backfill so existing confirmed matches show up on the new
--      per-mode ladders straight away.
--
-- Safe to run more than once. Does not change any existing squads.xp
-- values (existing confirmed matches are marked xp_awarded = true before
-- the backfill, so their overall XP is not awarded twice).
--
-- New projects: supabase/schema.sql already includes all of this.

-- -----------------------------------------------------------------------------
-- 1. squad_mode_stats
-- -----------------------------------------------------------------------------
create table if not exists public.squad_mode_stats (
  squad_id uuid not null references public.squads(id) on delete cascade,
  size text not null check (size in ('2v2','3v3','4v4','5v5','6v6','7v7','8v8','9v9','10v10','11v11')),
  xp int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (squad_id, size)
);

create index if not exists squad_mode_stats_size_xp_idx
  on public.squad_mode_stats (size, xp desc);

alter table public.squad_mode_stats enable row level security;

drop policy if exists "squad mode stats are readable by any authenticated user"
  on public.squad_mode_stats;
create policy "squad mode stats are readable by any authenticated user"
  on public.squad_mode_stats for select
  to authenticated
  using (true);

-- Deliberately NO insert/update/delete policies: the only way to write this
-- table is through award_match_xp() below, which runs as the table owner.
-- So nobody can edit their own per-mode XP directly from the browser.

-- -----------------------------------------------------------------------------
-- 2. matches.xp_awarded
-- -----------------------------------------------------------------------------
alter table public.matches
  add column if not exists xp_awarded boolean not null default false;

-- -----------------------------------------------------------------------------
-- 3. award_match_xp()
-- -----------------------------------------------------------------------------
-- Keep these numbers in sync with XP_WIN / XP_LOSS in src/lib/xp.ts.
create or replace function public.award_match_xp(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.matches%rowtype;
  v_loser uuid;
  v_win_xp constant int := 50;
  v_loss_xp constant int := 15;
begin
  -- Caller must belong to one of the two squads in the match.
  if not exists (
    select 1
    from public.matches mm
    join public.squad_members sm
      on sm.squad_id in (mm.squad_a_id, mm.squad_b_id)
    where mm.id = p_match_id
      and sm.user_id = auth.uid()
  ) then
    raise exception 'not a member of either squad in this match';
  end if;

  -- Claim the award atomically: only one call can flip xp_awarded, and only
  -- for a confirmed match with a winner. Everyone else gets no row back.
  update public.matches
     set xp_awarded = true
   where id = p_match_id
     and status = 'confirmed'
     and winner_squad_id is not null
     and xp_awarded = false
  returning * into m;

  if not found then
    return; -- not confirmed yet, or already awarded
  end if;

  v_loser := case when m.winner_squad_id = m.squad_a_id then m.squad_b_id else m.squad_a_id end;

  -- Overall ladder
  update public.squads set xp = xp + v_win_xp where id = m.winner_squad_id;
  if v_loser is not null then
    update public.squads set xp = xp + v_loss_xp where id = v_loser;
  end if;

  -- Per-mode ladder (skipped for any legacy match without a valid size)
  if m.size in ('2v2','3v3','4v4','5v5','6v6','7v7','8v8','9v9','10v10','11v11') then
    insert into public.squad_mode_stats as s (squad_id, size, xp, wins, losses)
    values (m.winner_squad_id, m.size, v_win_xp, 1, 0)
    on conflict (squad_id, size) do update
      set xp = s.xp + excluded.xp,
          wins = s.wins + 1,
          updated_at = now();

    if v_loser is not null then
      insert into public.squad_mode_stats as s (squad_id, size, xp, wins, losses)
      values (v_loser, m.size, v_loss_xp, 0, 1)
      on conflict (squad_id, size) do update
        set xp = s.xp + excluded.xp,
            losses = s.losses + 1,
            updated_at = now();
    end if;
  end if;
end;
$$;

revoke all on function public.award_match_xp(uuid) from public, anon;
grant execute on function public.award_match_xp(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Backfill from matches confirmed before this migration
-- -----------------------------------------------------------------------------
-- Those matches already had their overall XP added by the old app code, so
-- mark them awarded (prevents double-awarding) and rebuild per-mode rows
-- from them. Only runs for matches not yet flagged, so re-running this file
-- is harmless.
with legacy as (
  update public.matches
     set xp_awarded = true
   where status = 'confirmed'
     and winner_squad_id is not null
     and xp_awarded = false
  returning *
),
results as (
  select winner_squad_id as squad_id, size, 50 as xp, 1 as wins, 0 as losses
    from legacy
  union all
  select case when winner_squad_id = squad_a_id then squad_b_id else squad_a_id end,
         size, 15, 0, 1
    from legacy
),
totals as (
  select squad_id, size, sum(xp)::int as xp, sum(wins)::int as wins, sum(losses)::int as losses
    from results
   where squad_id is not null
     and size in ('2v2','3v3','4v4','5v5','6v6','7v7','8v8','9v9','10v10','11v11')
   group by squad_id, size
)
insert into public.squad_mode_stats as s (squad_id, size, xp, wins, losses)
select squad_id, size, xp, wins, losses from totals
on conflict (squad_id, size) do update
  set xp = s.xp + excluded.xp,
      wins = s.wins + excluded.wins,
      losses = s.losses + excluded.losses,
      updated_at = now();
