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

## Out of Scope (Manual Action Required)

`public.spatial_ref_sys` — PostGIS system table, app-role can't ALTER it.
Options (pick one in Supabase dashboard):
- Move PostGIS to `extensions` schema: `ALTER EXTENSION postgis SET SCHEMA extensions;`
  (Then `spatial_ref_sys` no longer in public, advisor stops flagging.)
- Or, in Supabase SQL Editor as `postgres` role: `ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;` (may require `supabase_admin`).

## Verification

1. `npm run lint` — no TS/lint errors in new migration.
2. Apply migration: `npx payload migrate` (against staging first).
3. Re-run Supabase Security Advisor → 44/45 ERRORs cleared (only `spatial_ref_sys` remains until manual action).
4. Smoke-test admin UI + a tour list page → confirm Payload still reads/writes (postgres role bypass works).

## Files

- **Created:** `apps/web/migrations/20260503_131600_enable_rls_public_tables.ts`
- **Modified:** `apps/web/migrations/index.ts`
- **Created:** this plan file
