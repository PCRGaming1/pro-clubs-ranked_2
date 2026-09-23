-- Wipe test squads/matches before real players see the leaderboard.
--
-- Run this ONCE in the Supabase SQL Editor, right before launch, after
-- you're done testing. It deletes every squad and everything hanging off
-- squads (memberships, challenge posts, matches, match reports, logged
-- stats) — but it does NOT touch `profiles` or `auth.users`, so your own
-- login/account survives. If you want to keep one or more squads (e.g. a
-- real squad you've already started using for real), see the "keep some
-- squads" variant at the bottom instead of running the plain version.
--
-- This is destructive and cannot be undone — there's no confirmation
-- prompt in the SQL Editor, so double-check you're pointed at the right
-- project before running it.

-- Deletion order matters (children before parents) since not every
-- foreign key here cascades:

delete from public.player_match_stats;
delete from public.match_reports;
delete from public.matches;
delete from public.match_posts;
delete from public.squad_members;
delete from public.squads;

-- -----------------------------------------------------------------------------
-- Variant: keep specific squads (e.g. ones with real players already in
-- them) and only wipe everything else. Comment out the six statements
-- above and uncomment this block instead, filling in the squad name(s)
-- you want to KEEP:
-- -----------------------------------------------------------------------------
-- with keep as (
--   select id from public.squads where name in ('Your Real Squad Name')
-- )
-- delete from public.player_match_stats where squad_id not in (select id from keep);
-- with keep as (
--   select id from public.squads where name in ('Your Real Squad Name')
-- )
-- delete from public.match_reports where squad_id not in (select id from keep);
-- with keep as (
--   select id from public.squads where name in ('Your Real Squad Name')
-- )
-- delete from public.matches
--   where squad_a_id not in (select id from keep)
--      or squad_b_id not in (select id from keep);
-- with keep as (
--   select id from public.squads where name in ('Your Real Squad Name')
-- )
-- delete from public.match_posts where squad_id not in (select id from keep);
-- with keep as (
--   select id from public.squads where name in ('Your Real Squad Name')
-- )
-- delete from public.squad_members where squad_id not in (select id from keep);
-- with keep as (
--   select id from public.squads where name in ('Your Real Squad Name')
-- )
-- delete from public.squads where id not in (select id from keep);
