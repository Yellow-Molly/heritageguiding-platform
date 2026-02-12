import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guides_additional_languages" AS ENUM('ja', 'zh', 'no', 'da', 'fi', 'nl', 'pt', 'ru', 'ar', 'ko', 'pl', 'th', 'hi');
  CREATE TYPE "public"."enum_guides_status" AS ENUM('active', 'inactive', 'on-leave');
  CREATE TYPE "public"."enum_group_inquiries_status" AS ENUM('new', 'contacted', 'quoted', 'booked', 'declined');
  ALTER TYPE "public"."enum_tours_target_audience" ADD VALUE 'solo_travelers';
  CREATE TABLE "guides_additional_languages" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_guides_additional_languages",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "guides_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"cities_id" integer
  );
  
  CREATE TABLE "group_inquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"group_size" numeric NOT NULL,
  	"preferred_dates" varchar NOT NULL,
  	"tour_interest" varchar,
  	"special_requirements" varchar,
  	"status" "enum_group_inquiries_status" DEFAULT 'new' NOT NULL,
  	"admin_notes" varchar,
  	"notification_sent" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"whatsapp_number" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "guides" ADD COLUMN "status" "enum_guides_status" DEFAULT 'active' NOT NULL;
  ALTER TABLE "guides" ADD COLUMN "phone" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "group_inquiries_id" integer;
  ALTER TABLE "guides_additional_languages" ADD CONSTRAINT "guides_additional_languages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_cities_fk" FOREIGN KEY ("cities_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guides_additional_languages_order_idx" ON "guides_additional_languages" USING btree ("order");
  CREATE INDEX "guides_additional_languages_parent_idx" ON "guides_additional_languages" USING btree ("parent_id");
  CREATE INDEX "guides_rels_order_idx" ON "guides_rels" USING btree ("order");
  CREATE INDEX "guides_rels_parent_idx" ON "guides_rels" USING btree ("parent_id");
  CREATE INDEX "guides_rels_path_idx" ON "guides_rels" USING btree ("path");
  CREATE INDEX "guides_rels_categories_id_idx" ON "guides_rels" USING btree ("categories_id");
  CREATE INDEX "guides_rels_cities_id_idx" ON "guides_rels" USING btree ("cities_id");
  CREATE INDEX "group_inquiries_email_idx" ON "group_inquiries" USING btree ("email");
  CREATE INDEX "group_inquiries_updated_at_idx" ON "group_inquiries" USING btree ("updated_at");
  CREATE INDEX "group_inquiries_created_at_idx" ON "group_inquiries" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_group_inquiries_fk" FOREIGN KEY ("group_inquiries_id") REFERENCES "public"."group_inquiries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_group_inquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("group_inquiries_id");`)
}

export async function down({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides_additional_languages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "group_inquiries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guides_additional_languages" CASCADE;
  DROP TABLE "guides_rels" CASCADE;
  DROP TABLE "group_inquiries" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_group_inquiries_fk";
  
  ALTER TABLE "tours_target_audience" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_tours_target_audience";
  CREATE TYPE "public"."enum_tours_target_audience" AS ENUM('family_friendly', 'couples', 'corporate', 'seniors', 'history_nerds', 'photography', 'art_lovers', 'food_wine', 'adventure', 'architecture');
  ALTER TABLE "tours_target_audience" ALTER COLUMN "value" SET DATA TYPE "public"."enum_tours_target_audience" USING "value"::"public"."enum_tours_target_audience";
  DROP INDEX "payload_locked_documents_rels_group_inquiries_id_idx";
  ALTER TABLE "guides" DROP COLUMN "status";
  ALTER TABLE "guides" DROP COLUMN "phone";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "group_inquiries_id";
  DROP TYPE "public"."enum_guides_additional_languages";
  DROP TYPE "public"."enum_guides_status";
  DROP TYPE "public"."enum_group_inquiries_status";`)
}
