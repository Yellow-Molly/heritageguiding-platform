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
 * What this does:
 *   1. Enable RLS on spatial_ref_sys (we own the table as postgres in Supabase
 *      managed Postgres — verified at write time).
 *   2. REVOKE EXECUTE ... FROM PUBLIC on the 3 st_estimatedextent overloads
 *      so anon/authenticated (if/when Supabase Data API is enabled) can't call
 *      them. The advisor mislabels these as SECURITY DEFINER (pg_proc.prosecdef
 *      is false), but the underlying issue — PUBLIC has EXECUTE — is real and
 *      this revoke is the correct fix either way.
 *
 * What this does NOT do:
 *   - Move PostGIS to a separate schema. PostGIS is non-relocatable
 *     (`ALTER EXTENSION postgis SET SCHEMA extensions` errors with "extension
 *     postgis does not support SET SCHEMA"). The only alternative is
 *     DROP EXTENSION CASCADE → CREATE in new schema → restore data, which is
 *     destructive (drops geometry columns on cities, neighborhoods, tours).
 *     Net effect: the `extension_in_public` WARN remains — accepted as
 *     cosmetic since the contained objects are individually hardened above.
 *
 * Idempotent: ALTER TABLE ... ENABLE ROW LEVEL SECURITY is a no-op when RLS
 * is already on, and REVOKE on an already-revoked grant is a no-op. Existence
 * guards against DBs that don't have PostGIS installed.
 *
 * Safe for app: app connects as postgres (BYPASSRLS + function owner), so
 * spatial queries via the geometry columns and any direct PostGIS calls keep
 * working. PUBLIC -> {} just means non-postgres roles lose EXECUTE, and
 * non-postgres roles don't exist on this managed DB today.
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
        EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
      END IF;

      -- 2. Revoke EXECUTE from PUBLIC on the 3 st_estimatedextent overloads.
      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'st_estimatedextent'
          AND pg_get_function_identity_arguments(p.oid) = 'text, text'
      ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM PUBLIC';
      END IF;

      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'st_estimatedextent'
          AND pg_get_function_identity_arguments(p.oid) = 'text, text, text'
      ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM PUBLIC';
      END IF;

      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'st_estimatedextent'
          AND pg_get_function_identity_arguments(p.oid) = 'text, text, text, boolean'
      ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM PUBLIC';
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
        EXECUTE 'ALTER TABLE public.spatial_ref_sys DISABLE ROW LEVEL SECURITY';
      END IF;

      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'st_estimatedextent'
          AND pg_get_function_identity_arguments(p.oid) = 'text, text'
      ) THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.st_estimatedextent(text, text) TO PUBLIC';
      END IF;

      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'st_estimatedextent'
          AND pg_get_function_identity_arguments(p.oid) = 'text, text, text'
      ) THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) TO PUBLIC';
      END IF;

      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'st_estimatedextent'
          AND pg_get_function_identity_arguments(p.oid) = 'text, text, text, boolean'
      ) THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) TO PUBLIC';
      END IF;
    END $$;
  `)
}
