# Security review — September 2026

Scope: the RLS policies in `supabase/schema.sql`, done ahead of taking Pro
Clubs Ranked live to real users. This is a code-level review of the
policies and how the app actually uses them (every `.update()` call in
`src/app/api` was read and cross-checked against each table's policies) —
it is not a penetration test, and it doesn't cover infrastructure
(Supabase/Vercel account security, secrets handling, etc.).

## Findings

### 1. `squads`, `match_posts` allowed any authenticated user to write any column — fixed

Both tables had a policy shaped like `using (true) with check (true)` on
`UPDATE`. The stated reason (documented in the schema's own comments) is
sound: there's no service-role key in this app, so routes that need to
touch a row belonging to a squad the caller isn't a member of (accepting
someone else's challenge post, awarding XP to both squads in a match) run
as the plain authenticated user, and a strict ownership policy would break
those flows.

The problem is that "broad enough for the legitimate case" was
implemented as "no restriction at all" — which meant, prior to this
review, any signed-in account could rename another squad, reassign its
captain, change its platform/region, or rewrite the size/region/note on
someone else's still-open challenge post. Nothing in the app's UI does
this, but RLS is the actual enforcement boundary; a modified or malicious
client could.

**Fix applied** (`supabase/migration_005_security_hardening.sql`, and
folded into `schema.sql` for fresh installs): kept the same "any
authenticated user can update" shape, but added a `WITH CHECK` that locks
every column to its existing value except the ones app code actually
writes via `UPDATE`. Verified exhaustively by grepping every
`.update()` call in `src/app/api`:

| Table | Columns app code ever writes via UPDATE |
|---|---|
| `squads` | `xp` (report route) OR `ea_club_id`/`ea_platform` (captain EA-link route) — never both in the same call |
| `match_posts` | `status`, `accepted_by_squad_id`, `match_id` (accept/cancel routes) |
| `matches` | `status`, `winner_squad_id` (report route) |

Everything else on those three tables (`name`, `captain_id`, `platform`,
`region` on squads; `squad_id`, `size`, `platform`, `region`, `note`,
`created_at` on match_posts; `squad_a_id`, `squad_b_id`, `size`,
`platform`, `region`, `created_at` on matches) is now locked to its
existing value by the policy itself, at the database layer — not just by
convention in the app code.

### 2. `squads.xp` remains writable by any authenticated user — accepted gap, not fixed

Closing this properly means the database itself deciding when XP changes,
gated on real match participation — which means moving XP awarding into a
`SECURITY DEFINER` Postgres function that only touches the `xp` column and
verifies the caller actually won/lost a real, confirmed match, rather than
trusting a client-supplied intent. That's a genuine (if fairly involved)
piece of engineering, not a policy tweak, so it's out of scope for this
pass — flagged here and in `schema.sql`'s comments as the top recommended
follow-up before the ladder has real competitive stakes riding on it. In
practice: today, a technically sophisticated user could grant their own
squad XP it didn't earn by calling the update directly rather than through
the app. There's no cash on the line, so the blast radius is "an inflated
leaderboard position," not a financial loss — worth knowing, not
necessarily worth blocking launch over.

### 3. Squad membership has no dedicated policies

There's no invite/remove/captaincy-transfer UI yet (documented in
README's "Known limitations"), so there are no policies for those actions
either — `squad_members` insert/delete only covers "join yourself" /
"leave yourself." Not a live vulnerability today since the feature doesn't
exist, but worth writing policies for whenever that feature is built,
rather than after.

### 4. No rate limiting / anti-abuse

RLS doesn't provide this regardless of how tight the policies are — a
signed-in user can still spam challenge posts, hammer the report endpoint,
etc. Out of scope for RLS hardening; would need application-level rate
limiting (e.g. at the Vercel edge, or a simple per-user cooldown check in
each route) if abuse becomes a real problem.

### 5. Match results are self-reported with no independent verification

By design (documented in the Terms of Service and About page) — this is a
product decision, not a bug. Worth knowing: a pair of colluding squads
could report a false result and it would confirm normally. Same
"no cash on the line" mitigation as #2.

## What was NOT reviewed

- Supabase project settings (API key rotation, project-level access
  controls, database backups/PITR).
- Vercel project settings (environment variable exposure, deployment
  protection).
- Dependency vulnerabilities (`npm audit` wasn't run as part of this
  pass).
- Anything client-side beyond what RLS already has to assume is
  untrusted.

## Recommendation before wider public launch

1. Apply `supabase/migration_005_security_hardening.sql` (or re-run
   `schema.sql` on a fresh project) — done as part of this pass.
2. When there's time: move XP awarding into a `SECURITY DEFINER` function
   (finding #2). Not urgent given there's no cash at stake, but the right
   long-term fix.
3. Revisit squad-membership policies whenever an invite/remove/captaincy
   feature is actually built (finding #3).
