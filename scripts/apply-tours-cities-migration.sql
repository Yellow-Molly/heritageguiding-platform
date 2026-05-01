-- One-off SQL to apply the tours.cities relation migration when
-- `npx payload migrate` hangs (Supabase connection-layer issue).
-- Mirrors apps/web/migrations/20260501_083209_add_tours_cities_relation.ts
-- and records the run in payload_migrations so future migrate:status
-- shows it as applied.
--
-- Run from repo root:
--   psql "$DATABASE_URL" -f scripts/apply-tours-cities-migration.sql

BEGIN;

ALTER TABLE "tours_rels" ADD COLUMN "cities_id" integer;

ALTER TABLE "tours_rels" ADD CONSTRAINT "tours_rels_cities_fk"
  FOREIGN KEY ("cities_id") REFERENCES "public"."cities"("id")
  ON DELETE cascade ON UPDATE no action;

CREATE INDEX "tours_rels_cities_id_idx" ON "tours_rels" USING btree ("cities_id");

INSERT INTO payload_migrations (name, batch, created_at, updated_at)
VALUES ('20260501_083209_add_tours_cities_relation', 7, NOW(), NOW());

COMMIT;
