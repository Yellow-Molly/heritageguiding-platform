-- Mirrors the up() body of 20260503_153500_postgis_security_hardening.ts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'spatial_ref_sys'
  ) THEN
    EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
  END IF;

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
