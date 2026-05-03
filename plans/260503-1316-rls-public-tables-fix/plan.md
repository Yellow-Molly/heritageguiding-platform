# Fix: Enable RLS on All Public Tables (Supabase Security Advisor)

**Date:** 2026-05-03
**Status:** Implementing
**Severity:** ERROR (EXTERNAL/SECURITY) — 45 tables flagged

## Problem

Supabase Security Advisor flagged 45 tables in `public` schema with `rls_disabled_in_public`. Without RLS, these tables are reachable through the Supabase PostgREST API using the project's `anon`/`authenticated` keys — even though our app uses Payload via direct Postgres connection and never touches the Supabase REST API.

## Root Cause

1. Prior migration `20260211_enable_rls_all_tables.ts` covered ~36 tables but is not reflected in the current DB state (likely DB clone/restore after migration ran, or migration history loss).
2. 7 tables added since were never covered:
   - `contact_inquiries`, `group_inquiries`, `site_settings`
   - `guides_rels`, `guides_additional_languages`
   - `guides_specialty_descriptions`, `guides_specialty_descriptions_locales`
3. `spatial_ref_sys` (PostGIS) — owned by `supabase_admin`; can't ALTER as app role.

## Why This Is Safe for the App

- Payload connects via `DATABASE_URL` as `postgres` superuser → has `BYPASSRLS` → app reads/writes unaffected.
- Effect: only PostgREST `anon`/`authenticated` API access (which we don't use) is blocked.
- No policies created → default deny for non-bypass roles.

## Fix

Single idempotent Payload migration:
- File: `apps/web/migrations/20260503_131600_enable_rls_public_tables.ts`
- Uses `DO $$ ... $$` block iterating a table-name array, with `pg_tables` existence guard (no errors if a table is missing in some env).
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is idempotent in Postgres → safe to re-run on tables already protected.
- Registered in `apps/web/migrations/index.ts`.

## Phase 2 (Resolved): PostGIS Hardening

After Phase 1 cleared 44 ERRORs, the advisor surfaced 1 ERROR + 7 WARN that
all root in PostGIS being installed in `public`. Investigation showed:
- The `postgres` connection role OWNS `spatial_ref_sys` and `st_estimatedextent`
  on this managed Postgres → no `supabase_admin` action needed.
- `ALTER EXTENSION postgis SET SCHEMA extensions` errors with "extension
  postgis does not support SET SCHEMA" (PostGIS is non-relocatable). The only
  alternative is DROP CASCADE + CREATE in new schema → restore data, which
  destroys 3 geometry columns (cities/neighborhoods/tours.coordinates).
  Trade-off rejected.
- `st_estimatedextent` overloads are NOT actually `SECURITY DEFINER`
  (`pg_proc.prosecdef = false`); the linter mislabels them, but the underlying
  problem — `EXECUTE` granted to `PUBLIC` — is real and the fix is the same.

**Migration:** `apps/web/migrations/20260503_153500_postgis_security_hardening.ts`
1. `ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY`
2. `REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(<3 overloads>) FROM PUBLIC`

Idempotent, with `pg_tables`/`pg_proc` existence guards.

**Privilege caveat (discovered via failed Vercel build fb0f187):**
PostGIS objects are owned by Supabase's *real* `postgres` superuser exposed
only on the direct connection (`db.<ref>.supabase.co:5432`). Vercel/Payload
typically connects via the pooler (`*.pooler.supabase.com:6543`) using a
shadow `postgres.<projectref>` role that lacks ownership and gets
`must be owner of table spatial_ref_sys`. The migration now wraps each
operation in `EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE` so
deploys stay green — but the actual work then needs **one-time manual apply**
per env via Supabase SQL Editor:

```sql
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM PUBLIC;
```

**Staging:** Already applied 2026-05-03 via direct-connection `psql` (back when
`apps/web/.env.local` temporarily pointed at staging). State verified:
`spatial_ref_sys.rowsecurity=true`, function ACLs collapsed to
`{postgres=X/postgres}`. The new soft-fail migration will record itself in
`payload_migrations` on next Vercel deploy without touching anything (no-op
under pooler role).

**Production:** Will need the manual SQL Editor step the first time the env
is set up. Document in deployment runbook.

## Accepted (No Action)

- **WARN `extension_in_public` for `postgis`** — non-relocatable; contained
  objects (`spatial_ref_sys`, functions) are individually hardened above.
  Cosmetic.
- **43 × INFO `rls_enabled_no_policy`** — RLS-on-with-no-policy = deny-all
  for non-bypass roles, which is the *intended* posture for tables that
  should never be PostgREST-readable. Adding a "deny all" policy would
  silence the lint but not change behavior.

## Verification

1. `npm run lint` — no TS/lint errors in new migration.
2. Apply migration: `npx payload migrate` (against staging first).
3. Re-run Supabase Security Advisor → 44/45 ERRORs cleared (only `spatial_ref_sys` remains until manual action).
4. Smoke-test admin UI + a tour list page → confirm Payload still reads/writes (postgres role bypass works).

## Files

- **Created:** `apps/web/migrations/20260503_131600_enable_rls_public_tables.ts`
- **Modified:** `apps/web/migrations/index.ts`
- **Created:** this plan file
