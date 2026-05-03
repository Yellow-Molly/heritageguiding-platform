-- Mirrors the down() body of 20260503_131600_enable_rls_public_tables.ts
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
