import { sql } from '@payloadcms/db-postgres'

/**
 * Phase 2 of Supabase Security Advisor cleanup, follow-up to
 * 20260503_131600_enable_rls_public_tables.ts.
 *
 * Clears the residual PostGIS-related findings:
 *   - 1 ERROR: rls_disabled_in_public on public.spatial_ref_sys
 *   - 6 WARN: anon_security_definer_function_executable +
 *             authenticated_security_definer_function_executable on
 *             3 overloads of public.st_estimatedextent
 *
 * What this does (when run by an owner role):
 *   1. ENABLE RLS on spatial_ref_sys.
 *   2. REVOKE EXECUTE ... FROM PUBLIC on the 3 st_estimatedextent overloads.
 *
 * Privilege model — IMPORTANT:
 *   spatial_ref_sys and the PostGIS functions are owned by the *real*
 *   `postgres` superuser exposed only via Supabase's direct connection
 *   (db.<ref>.supabase.co:5432). Vercel/Payload typically connects via
 *   Supabase's pooler (aws-N-<region>.pooler.supabase.com:6543) using a
 *   shadow `postgres.<projectref>` role that lacks ownership on these
 *   PostGIS objects, so the underlying ALTER/REVOKE fails with
 *   "must be owner of table spatial_ref_sys".
 *
 *   To keep deploys green this migration catches `insufficient_privilege`
 *   per operation and emits a NOTICE. The actual hardening must then be
 *   applied once-per-env via Supabase SQL Editor (which runs as the real
 *   postgres/supabase_admin role) — see plan.md for the exact SQL.
 *
 * Idempotent in both modes (work + soft no-op). Existence guards handle
 * DBs without PostGIS installed.
 *
 * What this does NOT do — move PostGIS to its own schema. PostGIS is
 * non-relocatable (`ALTER EXTENSION postgis SET SCHEMA extensions` errors
 * with "extension postgis does not support SET SCHEMA"). The only path is
 * DROP CASCADE → CREATE in new schema → restore data, which destroys the
 * geometry columns on cities/neighborhoods/tours. The remaining
 * `extension_in_public` WARN is accepted as cosmetic.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      -- 1. Enable RLS on spatial_ref_sys (PostGIS reference table).
      IF EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'spatial_ref_sys'
      ) THEN
        BEGIN
          EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
        EXCEPTION WHEN insufficient_privilege THEN
          RAISE NOTICE 'Skipping spatial_ref_sys RLS: connection role lacks ownership. Apply via Supabase SQL Editor.';
        END;
      END IF;

      -- 2. Revoke EXECUTE from PUBLIC on the 3 st_estimatedextent overloads.
      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'st_estimatedextent'
          AND pg_get_function_identity_arguments(p.oid) = 'text, text'
      ) THEN
        BEGIN
          EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM PUBLIC';
        EXCEPTION WHEN insufficient_privilege THEN
          RAISE NOTICE 'Skipping st_estimatedextent(text,text) revoke: connection role lacks ownership.';
        END;
      END IF;

      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'st_estimatedextent'
          AND pg_get_function_identity_arguments(p.oid) = 'text, text, text'
      ) THEN
        BEGIN
          EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM PUBLIC';
        EXCEPTION WHEN insufficient_privilege THEN
          RAISE NOTICE 'Skipping st_estimatedextent(text,text,text) revoke: connection role lacks ownership.';
        END;
      END IF;

      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'st_estimatedextent'
          AND pg_get_function_identity_arguments(p.oid) = 'text, text, text, boolean'
      ) THEN
        BEGIN
          EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM PUBLIC';
        EXCEPTION WHEN insufficient_privilege THEN
          RAISE NOTICE 'Skipping st_estimatedextent(text,text,text,boolean) revoke: connection role lacks ownership.';
        END;
      END IF;
    END $$;
  `)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'spatial_ref_sys'
      ) THEN
        BEGIN
          EXECUTE 'ALTER TABLE public.spatial_ref_sys DISABLE ROW LEVEL SECURITY';
        EXCEPTION WHEN insufficient_privilege THEN
          RAISE NOTICE 'Skipping spatial_ref_sys RLS rollback: connection role lacks ownership.';
        END;
      END IF;

      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'st_estimatedextent'
          AND pg_get_function_identity_arguments(p.oid) = 'text, text'
      ) THEN
        BEGIN
          EXECUTE 'GRANT EXECUTE ON FUNCTION public.st_estimatedextent(text, text) TO PUBLIC';
        EXCEPTION WHEN insufficient_privilege THEN
          RAISE NOTICE 'Skipping st_estimatedextent(text,text) grant rollback: connection role lacks ownership.';
        END;
      END IF;

      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'st_estimatedextent'
          AND pg_get_function_identity_arguments(p.oid) = 'text, text, text'
      ) THEN
        BEGIN
          EXECUTE 'GRANT EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) TO PUBLIC';
        EXCEPTION WHEN insufficient_privilege THEN
          RAISE NOTICE 'Skipping st_estimatedextent(text,text,text) grant rollback: connection role lacks ownership.';
        END;
      END IF;

      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'st_estimatedextent'
          AND pg_get_function_identity_arguments(p.oid) = 'text, text, text, boolean'
      ) THEN
        BEGIN
          EXECUTE 'GRANT EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) TO PUBLIC';
        EXCEPTION WHEN insufficient_privilege THEN
          RAISE NOTICE 'Skipping st_estimatedextent(text,text,text,boolean) grant rollback: connection role lacks ownership.';
        END;
      END IF;
    END $$;
  `)
}
