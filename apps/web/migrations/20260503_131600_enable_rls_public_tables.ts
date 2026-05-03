import { sql } from '@payloadcms/db-postgres'

/**
 * Enable Row Level Security (RLS) on all public tables flagged by Supabase
 * Security Advisor (rls_disabled_in_public).
 *
 * Why: Supabase exposes the `public` schema via PostgREST (anon/authenticated
 * roles). Without RLS, every row is readable through the project's anon key.
 * Our app uses Payload via DATABASE_URL as the `postgres` superuser, which
 * has BYPASSRLS — so this migration is zero-impact for application reads/writes
 * but slams the door on the Supabase REST API that we never use.
 *
 * No policies are created → with RLS on and no policy, non-bypass roles
 * (anon, authenticated) get a deny-all, which is exactly what we want.
 *
 * Idempotent: ALTER TABLE ... ENABLE ROW LEVEL SECURITY is a no-op when RLS
 * is already enabled. The DO block uses pg_tables to skip tables that don't
 * exist in a given environment (covers fresh-clone vs. fully-migrated DBs).
 *
 * Excluded: `public.spatial_ref_sys` is owned by `supabase_admin` and cannot
 * be altered by the app role. Fix manually via Supabase dashboard — either
 * `ALTER EXTENSION postgis SET SCHEMA extensions;` or enable RLS as superuser.
 *
 * Supersedes the table list in 20260211_enable_rls_all_tables.ts (also covers
 * 7 collections added since: contact_inquiries, group_inquiries, site_settings,
 * guides_rels, guides_additional_languages, guides_specialty_descriptions,
 * guides_specialty_descriptions_locales).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      target_table text;
      tables text[] := ARRAY[
        -- Auth & users
        'users', 'users_sessions',
        -- Media
        'media', 'media_locales',
        -- Tours
        'tours', 'tours_locales', 'tours_rels',
        'tours_highlights', 'tours_included', 'tours_not_included',
        'tours_what_to_bring', 'tours_target_audience',
        'tours_images', 'tours_images_locales',
        -- Guides
        'guides', 'guides_locales', 'guides_rels',
        'guides_credentials', 'guides_credentials_locales',
        'guides_languages', 'guides_additional_languages',
        'guides_specialty_descriptions', 'guides_specialty_descriptions_locales',
        -- Taxonomy
        'categories', 'categories_locales',
        'cities', 'cities_locales',
        'neighborhoods', 'neighborhoods_locales',
        -- Content
        'reviews', 'reviews_locales',
        'pages', 'pages_locales',
        -- Transactional
        'bookings', 'group_inquiries', 'contact_inquiries',
        -- Globals
        'site_settings',
        -- Payload internals
        'payload_kv', 'payload_migrations',
        'payload_locked_documents', 'payload_locked_documents_rels',
        'payload_preferences', 'payload_preferences_rels'
      ];
    BEGIN
      FOREACH target_table IN ARRAY tables
      LOOP
        IF EXISTS (
          SELECT 1 FROM pg_tables
          WHERE schemaname = 'public' AND tablename = target_table
        ) THEN
          EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
        END IF;
      END LOOP;
    END $$;
  `)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      target_table text;
      tables text[] := ARRAY[
        'users', 'users_sessions',
        'media', 'media_locales',
        'tours', 'tours_locales', 'tours_rels',
        'tours_highlights', 'tours_included', 'tours_not_included',
        'tours_what_to_bring', 'tours_target_audience',
        'tours_images', 'tours_images_locales',
        'guides', 'guides_locales', 'guides_rels',
        'guides_credentials', 'guides_credentials_locales',
        'guides_languages', 'guides_additional_languages',
        'guides_specialty_descriptions', 'guides_specialty_descriptions_locales',
        'categories', 'categories_locales',
        'cities', 'cities_locales',
        'neighborhoods', 'neighborhoods_locales',
        'reviews', 'reviews_locales',
        'pages', 'pages_locales',
        'bookings', 'group_inquiries', 'contact_inquiries',
        'site_settings',
        'payload_kv', 'payload_migrations',
        'payload_locked_documents', 'payload_locked_documents_rels',
        'payload_preferences', 'payload_preferences_rels'
      ];
    BEGIN
      FOREACH target_table IN ARRAY tables
      LOOP
        IF EXISTS (
          SELECT 1 FROM pg_tables
          WHERE schemaname = 'public' AND tablename = target_table
        ) THEN
          EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', target_table);
        END IF;
      END LOOP;
    END $$;
  `)
}
