-- Pro Clubs Ranked (PCR) — migration 003
--
-- Adds the columns needed to (eventually) link a profile/squad to EA's
-- in-game data, so match stats could be auto-imported instead of typed in
-- by hand. See README.md -> "EA stats auto-import (experimental)" for the
-- full explanation of what this is and, importantly, what it ISN'T yet:
-- these columns are just storage. Nothing reads them automatically or
-- writes to player_match_stats on its own — self-reported stats are still
-- the only thing that actually populates the leaderboard right now.
--
-- Safe to run more than once (IF NOT EXISTS on every column). Does not
-- touch any existing rows in profiles or squads.

-- The player's exact PSN / Xbox gamertag / EA ID, as it appears in EA's
-- own match data. This is how a future sync job would match "this row in
-- an EA match" to "this PCR profile" — there's no other shared identifier.
alter table public.profiles
  add column if not exists ea_persona_name text;

-- Which EA club this squad corresponds to, and which platform group EA's
-- API expects for it (their API buckets platforms together, e.g. current-
-- gen consoles as one group — see README for the caveats around this).
alter table public.squads
  add column if not exists ea_club_id text;

alter table public.squads
  add column if not exists ea_platform text;
