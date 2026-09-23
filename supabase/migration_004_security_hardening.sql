-- Migration 004 — RLS hardening ahead of public launch
--
-- =============================================================================
-- WHAT THIS DOES
-- The three "any authenticated user can update this row" policies on
-- `squads`, `match_posts`, and `matches` exist because there's no
-- service-role key in this app (see the comment block at the top of
-- schema.sql) — routes that need to touch a row on behalf of a squad the
-- caller isn't a member of (accepting a challenge, confirming a match,
-- awarding XP to both sides) run as the plain authenticated user, so the
-- policy has to be broad enough to let that happen.
--
-- The problem: "broad enough to let the legitimate update happen" was
-- implemented as "wide open" — using(true)/with check(true) on `squads`
-- and `match_posts`, meaning any signed-in user could, today, rename
-- someone else's squad, reassign its captain, change its platform/region,
-- or rewrite the size/region/note on someone else's open challenge post.
-- Nothing in the app's own UI does this, but RLS is the actual security
-- boundary — if it allows it, a malicious or buggy client can do it.
--
-- The fix: this migration replaces those three broad policies with
-- versions that keep the same "any authenticated user can update" shape
-- (still no service-role key, so we can't tighten to strict ownership
-- without breaking the accept/report flows) but add a WITH CHECK clause
-- that locks every column the app never legitimately touches via UPDATE
-- to its existing value. Only the columns real app code actually writes
-- (verified by reading every `.update()` call in src/app/api) are left
-- open. See SECURITY_REVIEW.md for the full audit this came out of.
--
-- WHAT THIS DOES NOT FIX (documented, not solved, here):
--   - `squads.xp` can still be changed by any authenticated user, not
--     just a real participant in a match involving that squad. Closing
--     this properly needs XP awards moved into a SECURITY DEFINER
--     Postgres function (schema.sql already flags this as the intended
--     next step) so the database — not client-supplied intent — decides
--     when XP changes. Recommended before the site has real competitive
--     stakes riding on the ladder.
--   - No rate limiting / anti-abuse — RLS doesn't give you that regardless.
--   - Squad membership changes (kicks, captaincy transfer) still have no
--     dedicated policies, because there's no UI for them yet either.
--
-- HOW TO APPLY: paste this into the Supabase SQL Editor and run it once,
-- the same way you'd run any other migration in this folder. Safe to run
-- on a live project — it only replaces policy definitions, touches no
-- data, and every column the app writes today stays writable exactly as
-- before. Please still smoke-test the challenge-board accept/cancel flow
-- and match reporting after applying, the same way you would after any
-- RLS change.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- squads: lock name / captain_id / platform / region to their existing
-- values. xp, ea_club_id, ea_platform remain freely updatable by any
-- authenticated user (see "what this does not fix" above for xp).
-- -----------------------------------------------------------------------------
drop policy if exists "any authenticated user can update a squad" on public.squads;

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
-- match_posts: only status / accepted_by_squad_id / match_id may change
-- (accept and cancel flows). squad_id, size, platform, region, note, and
-- created_at are locked to their existing values.
-- -----------------------------------------------------------------------------
drop policy if exists "any authenticated user can update a match post" on public.match_posts;

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
-- matches: only status / winner_squad_id (and the unused legacy
-- reported_by) may change. squad_a_id, squad_b_id, size, platform,
-- region, and created_at are locked to their existing values. The
-- existing "member of either squad" ownership check (USING) is untouched
-- — this only adds the column lock on top of it.
-- -----------------------------------------------------------------------------
drop policy if exists "a member of either squad can update a match to report a result" on public.matches;

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
