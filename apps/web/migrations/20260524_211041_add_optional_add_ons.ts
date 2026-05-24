import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add Optional Add-ons (Bokun Extras mirror) to Tours
 *                + Add Bookings.add_ons JSONB column for purchased add-ons.
 *
 * Schema additions:
 *  - `tours_optional_add_ons`           — Payload array table (one row per add-on per tour)
 *  - `tours_optional_add_ons_locales`   — localized name + description (sv|en|de)
 *  - `bookings.add_ons` (JSONB)         — purchased add-ons captured from webhook
 *  - 2 enums: pricing_type + currency
 *
 * NOTE: Payload migrate:create generated SQL that ALSO included pre-existing
 * bokun_sync_* columns + payload_jobs tables due to snapshot drift from the
 * earlier hand-written migration (20260514_174200_add_bokun_sync_fields.ts).
 * Those were trimmed here — this migration contains only the genuine new delta.
 * The .json snapshot retains the full schema state for future migrate:create runs.
 *
 * RLS enabled on the two new tables to match the project-wide pattern (anon
 * /authenticated PostgREST roles get no access; Payload uses postgres superuser
 * which bypasses RLS). Matches `20260211_enable_rls_all_tables.ts`.
 *
 * @see plans/260519-2046-bokun-extras-add-ons-checkout/phase-02-cms-schema-tours-addons-and-bookings-column.md
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_tours_optional_add_ons_pricing_type" AS ENUM('perBooking', 'perPerson');
    CREATE TYPE "public"."enum_tours_optional_add_ons_currency" AS ENUM('SEK', 'EUR', 'USD');

    CREATE TABLE "tours_optional_add_ons" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "pricing_type" "enum_tours_optional_add_ons_pricing_type" DEFAULT 'perBooking' NOT NULL,
      "adult_price_hint" numeric NOT NULL,
      "child_price_hint" numeric,
      "currency" "enum_tours_optional_add_ons_currency" DEFAULT 'SEK',
      "is_required" boolean DEFAULT false,
      "bokun_extra_id" varchar,
      "display_order" numeric DEFAULT 0
    );

    CREATE TABLE "tours_optional_add_ons_locales" (
      "name" varchar NOT NULL,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    ALTER TABLE "bookings" ADD COLUMN "add_ons" jsonb;

    ALTER TABLE "tours_optional_add_ons"
      ADD CONSTRAINT "tours_optional_add_ons_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "tours_optional_add_ons_locales"
      ADD CONSTRAINT "tours_optional_add_ons_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."tours_optional_add_ons"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "tours_optional_add_ons_order_idx" ON "tours_optional_add_ons" USING btree ("_order");
    CREATE INDEX "tours_optional_add_ons_parent_id_idx" ON "tours_optional_add_ons" USING btree ("_parent_id");
    CREATE UNIQUE INDEX "tours_optional_add_ons_locales_locale_parent_id_unique"
      ON "tours_optional_add_ons_locales" USING btree ("_locale", "_parent_id");

    ALTER TABLE "public"."tours_optional_add_ons" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "public"."tours_optional_add_ons_locales" ENABLE ROW LEVEL SECURITY;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tours_optional_add_ons" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "tours_optional_add_ons_locales" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "tours_optional_add_ons_locales" CASCADE;
    DROP TABLE "tours_optional_add_ons" CASCADE;
    ALTER TABLE "bookings" DROP COLUMN "add_ons";
    DROP TYPE "public"."enum_tours_optional_add_ons_currency";
    DROP TYPE "public"."enum_tours_optional_add_ons_pricing_type";
  `)
}
