import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: { db: any }): Promise<void> {
  // Guide profile structured fields (Phase 2 of guide-profile-redesign)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "guides_specialty_descriptions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "guides_specialty_descriptions_locales" (
      "description" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    ALTER TABLE "guides_locales" ADD COLUMN IF NOT EXISTS "guide_style" varchar;
    ALTER TABLE "guides_locales" ADD COLUMN IF NOT EXISTS "what_guests_appreciate" varchar;
    ALTER TABLE "guides_locales" ADD COLUMN IF NOT EXISTS "unique_aspects_quote" varchar;
    ALTER TABLE "guides_locales" ADD COLUMN IF NOT EXISTS "unique_aspects_body" varchar;

    DO $$ BEGIN
      ALTER TABLE "guides_specialty_descriptions"
        ADD CONSTRAINT "guides_specialty_descriptions_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "guides_specialty_descriptions_locales"
        ADD CONSTRAINT "guides_specialty_descriptions_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_specialty_descriptions"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "guides_specialty_descriptions_order_idx"
      ON "guides_specialty_descriptions" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "guides_specialty_descriptions_parent_id_idx"
      ON "guides_specialty_descriptions" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "guides_specialty_descriptions_locales_locale_parent_id_uniqu"
      ON "guides_specialty_descriptions_locales" USING btree ("_locale","_parent_id");
  `)
}

export async function down({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "guides_specialty_descriptions" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "guides_specialty_descriptions_locales" DISABLE ROW LEVEL SECURITY;
    DROP TABLE IF EXISTS "guides_specialty_descriptions_locales" CASCADE;
    DROP TABLE IF EXISTS "guides_specialty_descriptions" CASCADE;
    ALTER TABLE "guides_locales" DROP COLUMN IF EXISTS "guide_style";
    ALTER TABLE "guides_locales" DROP COLUMN IF EXISTS "what_guests_appreciate";
    ALTER TABLE "guides_locales" DROP COLUMN IF EXISTS "unique_aspects_quote";
    ALTER TABLE "guides_locales" DROP COLUMN IF EXISTS "unique_aspects_body";
  `)
}
