import { sql } from '@payloadcms/db-postgres'

/**
 * Enable Row Level Security (RLS) on all public tables.
 *
 * Context: Supabase PostgREST exposes the public schema via anon/authenticated roles.
 * Without RLS, data is accessible through the Supabase API keys.
 *
 * Payload CMS connects as the `postgres` superuser which bypasses RLS,
 * so this migration has zero impact on application functionality.
 *
 * Effect: Blocks all PostgREST API access (anon/authenticated roles) to these tables.
 *
 * Note: spatial_ref_sys excluded - owned by supabase_admin, must be fixed via Supabase dashboard.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    -- Enable RLS on all application tables
    ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."users_sessions" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."media_locales" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_highlights" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_included" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_not_included" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_what_to_bring" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_target_audience" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_images" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_images_locales" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_locales" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_rels" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."guides" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."guides_credentials" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."guides_credentials_locales" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."guides_languages" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."guides_locales" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."categories_locales" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."cities" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."cities_locales" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."neighborhoods" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."neighborhoods_locales" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."reviews_locales" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."pages" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."pages_locales" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;

    -- Enable RLS on Payload CMS internal tables
    ALTER TABLE "public"."payload_kv" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."payload_migrations" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."payload_locked_documents" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."payload_locked_documents_rels" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."payload_preferences" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."payload_preferences_rels" ENABLE ROW LEVEL SECURITY;

  `)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    -- Disable RLS on all tables
    ALTER TABLE "public"."users" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."users_sessions" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."media" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."media_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_highlights" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_included" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_not_included" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_what_to_bring" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_target_audience" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_images" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_images_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_rels" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."guides" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."guides_credentials" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."guides_credentials_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."guides_languages" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."guides_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."categories" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."categories_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."cities" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."cities_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."neighborhoods" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."neighborhoods_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."reviews" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."reviews_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."pages" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."pages_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."bookings" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."payload_kv" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."payload_migrations" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."payload_locked_documents" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."payload_locked_documents_rels" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."payload_preferences" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."payload_preferences_rels" DISABLE ROW LEVEL SECURITY;
  `)
}
