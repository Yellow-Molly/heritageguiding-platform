import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('sv', 'en', 'de');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_tours_target_audience" AS ENUM('family_friendly', 'couples', 'corporate', 'seniors', 'history_nerds', 'photography', 'art_lovers', 'food_wine', 'adventure', 'architecture');
  CREATE TYPE "public"."enum_tours_pricing_currency" AS ENUM('SEK', 'EUR', 'USD');
  CREATE TYPE "public"."enum_tours_pricing_price_type" AS ENUM('per_person', 'per_group', 'custom');
  CREATE TYPE "public"."enum_tours_difficulty_level" AS ENUM('easy', 'moderate', 'challenging');
  CREATE TYPE "public"."enum_tours_availability" AS ENUM('available', 'seasonal', 'by_request', 'unavailable');
  CREATE TYPE "public"."enum_tours_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_guides_languages" AS ENUM('sv', 'en', 'de', 'fr', 'es', 'it');
  CREATE TYPE "public"."enum_categories_type" AS ENUM('theme', 'activity');
  CREATE TYPE "public"."enum_pages_page_type" AS ENUM('about', 'faq', 'terms', 'privacy', 'contact', 'custom');
  CREATE TYPE "public"."enum_bookings_status" AS ENUM('pending', 'confirmed', 'cancelled', 'on_hold');
  CREATE TYPE "public"."enum_bookings_last_webhook_event" AS ENUM('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_MODIFIED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "tours_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"highlight" varchar NOT NULL
  );
  
  CREATE TABLE "tours_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "tours_not_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "tours_what_to_bring" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "tours_target_audience" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_tours_target_audience",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "tours_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"is_primary" boolean DEFAULT false
  );
  
  CREATE TABLE "tours_images_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "tours" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"pricing_base_price" numeric NOT NULL,
  	"pricing_currency" "enum_tours_pricing_currency" DEFAULT 'SEK',
  	"pricing_price_type" "enum_tours_pricing_price_type" NOT NULL,
  	"pricing_group_discount" boolean DEFAULT false,
  	"pricing_child_price" numeric,
  	"duration_hours" numeric NOT NULL,
  	"logistics_coordinates" geometry(Point),
  	"logistics_google_maps_link" varchar,
  	"difficulty_level" "enum_tours_difficulty_level",
  	"age_recommendation_minimum_age" numeric,
  	"age_recommendation_child_friendly" boolean DEFAULT false,
  	"age_recommendation_teen_friendly" boolean DEFAULT false,
  	"accessibility_wheelchair_accessible" boolean DEFAULT false,
  	"accessibility_hearing_assistance" boolean DEFAULT false,
  	"accessibility_visual_assistance" boolean DEFAULT false,
  	"accessibility_service_animals_allowed" boolean DEFAULT true,
  	"guide_id" integer NOT NULL,
  	"bokun_experience_id" varchar,
  	"availability" "enum_tours_availability" DEFAULT 'available',
  	"max_group_size" numeric,
  	"min_group_size" numeric DEFAULT 1,
  	"seo_og_image_id" integer,
  	"featured" boolean DEFAULT false,
  	"status" "enum_tours_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tours_locales" (
  	"title" varchar NOT NULL,
  	"description" jsonb NOT NULL,
  	"short_description" varchar NOT NULL,
  	"duration_duration_text" varchar,
  	"logistics_meeting_point_name" varchar NOT NULL,
  	"logistics_meeting_point_address" varchar,
  	"logistics_meeting_point_instructions" varchar,
  	"logistics_ending_point" varchar,
  	"logistics_parking_info" varchar,
  	"logistics_public_transport_info" varchar,
  	"accessibility_mobility_notes" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "tours_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"neighborhoods_id" integer
  );
  
  CREATE TABLE "guides_credentials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "guides_credentials_locales" (
  	"credential" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guides_languages" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_guides_languages",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "guides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"photo_id" integer,
  	"email" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "guides_locales" (
  	"bio" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"type" "enum_categories_type" DEFAULT 'theme' NOT NULL,
  	"icon" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "cities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"country" varchar DEFAULT 'Sweden' NOT NULL,
  	"coordinates" geometry(Point),
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cities_locales" (
  	"name" varchar NOT NULL,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "neighborhoods" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"city_id" integer NOT NULL,
  	"coordinates" geometry(Point),
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "neighborhoods_locales" (
  	"name" varchar NOT NULL,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tour_id" integer NOT NULL,
  	"rating" numeric NOT NULL,
  	"author_name" varchar NOT NULL,
  	"author_country" varchar,
  	"date" timestamp(3) with time zone NOT NULL,
  	"verified" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reviews_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"page_type" "enum_pages_page_type" NOT NULL,
  	"show_in_footer" boolean DEFAULT true,
  	"show_in_header" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bokun_booking_id" varchar NOT NULL,
  	"confirmation_code" varchar NOT NULL,
  	"status" "enum_bookings_status" DEFAULT 'pending' NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"customer_email" varchar NOT NULL,
  	"customer_phone" varchar,
  	"tour_id" integer,
  	"bokun_experience_id" varchar,
  	"booking_date" timestamp(3) with time zone,
  	"start_time" varchar,
  	"participants" numeric,
  	"total_price" varchar NOT NULL,
  	"currency" varchar DEFAULT 'SEK' NOT NULL,
  	"last_webhook_event" "enum_bookings_last_webhook_event",
  	"webhook_received_at" timestamp(3) with time zone,
  	"confirmation_email_sent" boolean DEFAULT false,
  	"confirmation_email_sent_at" timestamp(3) with time zone,
  	"raw_payload" jsonb,
  	"internal_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"tours_id" integer,
  	"guides_id" integer,
  	"categories_id" integer,
  	"cities_id" integer,
  	"neighborhoods_id" integer,
  	"reviews_id" integer,
  	"pages_id" integer,
  	"bookings_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tours_highlights" ADD CONSTRAINT "tours_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tours_included" ADD CONSTRAINT "tours_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tours_not_included" ADD CONSTRAINT "tours_not_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tours_what_to_bring" ADD CONSTRAINT "tours_what_to_bring_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tours_target_audience" ADD CONSTRAINT "tours_target_audience_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tours_images" ADD CONSTRAINT "tours_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tours_images" ADD CONSTRAINT "tours_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tours_images_locales" ADD CONSTRAINT "tours_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tours_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tours" ADD CONSTRAINT "tours_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tours" ADD CONSTRAINT "tours_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tours_locales" ADD CONSTRAINT "tours_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tours_rels" ADD CONSTRAINT "tours_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tours_rels" ADD CONSTRAINT "tours_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tours_rels" ADD CONSTRAINT "tours_rels_neighborhoods_fk" FOREIGN KEY ("neighborhoods_id") REFERENCES "public"."neighborhoods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_credentials" ADD CONSTRAINT "guides_credentials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_credentials_locales" ADD CONSTRAINT "guides_credentials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_credentials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_languages" ADD CONSTRAINT "guides_languages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_locales" ADD CONSTRAINT "guides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cities_locales" ADD CONSTRAINT "cities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "neighborhoods" ADD CONSTRAINT "neighborhoods_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "neighborhoods" ADD CONSTRAINT "neighborhoods_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "neighborhoods_locales" ADD CONSTRAINT "neighborhoods_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."neighborhoods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews_locales" ADD CONSTRAINT "reviews_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tours_fk" FOREIGN KEY ("tours_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cities_fk" FOREIGN KEY ("cities_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_neighborhoods_fk" FOREIGN KEY ("neighborhoods_id") REFERENCES "public"."neighborhoods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tours_highlights_order_idx" ON "tours_highlights" USING btree ("_order");
  CREATE INDEX "tours_highlights_parent_id_idx" ON "tours_highlights" USING btree ("_parent_id");
  CREATE INDEX "tours_highlights_locale_idx" ON "tours_highlights" USING btree ("_locale");
  CREATE INDEX "tours_included_order_idx" ON "tours_included" USING btree ("_order");
  CREATE INDEX "tours_included_parent_id_idx" ON "tours_included" USING btree ("_parent_id");
  CREATE INDEX "tours_included_locale_idx" ON "tours_included" USING btree ("_locale");
  CREATE INDEX "tours_not_included_order_idx" ON "tours_not_included" USING btree ("_order");
  CREATE INDEX "tours_not_included_parent_id_idx" ON "tours_not_included" USING btree ("_parent_id");
  CREATE INDEX "tours_not_included_locale_idx" ON "tours_not_included" USING btree ("_locale");
  CREATE INDEX "tours_what_to_bring_order_idx" ON "tours_what_to_bring" USING btree ("_order");
  CREATE INDEX "tours_what_to_bring_parent_id_idx" ON "tours_what_to_bring" USING btree ("_parent_id");
  CREATE INDEX "tours_what_to_bring_locale_idx" ON "tours_what_to_bring" USING btree ("_locale");
  CREATE INDEX "tours_target_audience_order_idx" ON "tours_target_audience" USING btree ("order");
  CREATE INDEX "tours_target_audience_parent_idx" ON "tours_target_audience" USING btree ("parent_id");
  CREATE INDEX "tours_images_order_idx" ON "tours_images" USING btree ("_order");
  CREATE INDEX "tours_images_parent_id_idx" ON "tours_images" USING btree ("_parent_id");
  CREATE INDEX "tours_images_image_idx" ON "tours_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "tours_images_locales_locale_parent_id_unique" ON "tours_images_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "tours_slug_idx" ON "tours" USING btree ("slug");
  CREATE INDEX "tours_guide_idx" ON "tours" USING btree ("guide_id");
  CREATE INDEX "tours_bokun_experience_id_idx" ON "tours" USING btree ("bokun_experience_id");
  CREATE INDEX "tours_availability_idx" ON "tours" USING btree ("availability");
  CREATE INDEX "tours_seo_seo_og_image_idx" ON "tours" USING btree ("seo_og_image_id");
  CREATE INDEX "tours_featured_idx" ON "tours" USING btree ("featured");
  CREATE INDEX "tours_status_idx" ON "tours" USING btree ("status");
  CREATE INDEX "tours_updated_at_idx" ON "tours" USING btree ("updated_at");
  CREATE INDEX "tours_created_at_idx" ON "tours" USING btree ("created_at");
  CREATE UNIQUE INDEX "tours_locales_locale_parent_id_unique" ON "tours_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tours_rels_order_idx" ON "tours_rels" USING btree ("order");
  CREATE INDEX "tours_rels_parent_idx" ON "tours_rels" USING btree ("parent_id");
  CREATE INDEX "tours_rels_path_idx" ON "tours_rels" USING btree ("path");
  CREATE INDEX "tours_rels_categories_id_idx" ON "tours_rels" USING btree ("categories_id");
  CREATE INDEX "tours_rels_neighborhoods_id_idx" ON "tours_rels" USING btree ("neighborhoods_id");
  CREATE INDEX "guides_credentials_order_idx" ON "guides_credentials" USING btree ("_order");
  CREATE INDEX "guides_credentials_parent_id_idx" ON "guides_credentials" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guides_credentials_locales_locale_parent_id_unique" ON "guides_credentials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guides_languages_order_idx" ON "guides_languages" USING btree ("order");
  CREATE INDEX "guides_languages_parent_idx" ON "guides_languages" USING btree ("parent_id");
  CREATE UNIQUE INDEX "guides_slug_idx" ON "guides" USING btree ("slug");
  CREATE INDEX "guides_photo_idx" ON "guides" USING btree ("photo_id");
  CREATE INDEX "guides_updated_at_idx" ON "guides" USING btree ("updated_at");
  CREATE INDEX "guides_created_at_idx" ON "guides" USING btree ("created_at");
  CREATE UNIQUE INDEX "guides_locales_locale_parent_id_unique" ON "guides_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "cities_slug_idx" ON "cities" USING btree ("slug");
  CREATE INDEX "cities_updated_at_idx" ON "cities" USING btree ("updated_at");
  CREATE INDEX "cities_created_at_idx" ON "cities" USING btree ("created_at");
  CREATE UNIQUE INDEX "cities_locales_locale_parent_id_unique" ON "cities_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "neighborhoods_slug_idx" ON "neighborhoods" USING btree ("slug");
  CREATE INDEX "neighborhoods_city_idx" ON "neighborhoods" USING btree ("city_id");
  CREATE INDEX "neighborhoods_image_idx" ON "neighborhoods" USING btree ("image_id");
  CREATE INDEX "neighborhoods_updated_at_idx" ON "neighborhoods" USING btree ("updated_at");
  CREATE INDEX "neighborhoods_created_at_idx" ON "neighborhoods" USING btree ("created_at");
  CREATE UNIQUE INDEX "neighborhoods_locales_locale_parent_id_unique" ON "neighborhoods_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "reviews_tour_idx" ON "reviews" USING btree ("tour_id");
  CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE UNIQUE INDEX "reviews_locales_locale_parent_id_unique" ON "reviews_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "bookings_bokun_booking_id_idx" ON "bookings" USING btree ("bokun_booking_id");
  CREATE INDEX "bookings_confirmation_code_idx" ON "bookings" USING btree ("confirmation_code");
  CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");
  CREATE INDEX "bookings_customer_email_idx" ON "bookings" USING btree ("customer_email");
  CREATE INDEX "bookings_tour_idx" ON "bookings" USING btree ("tour_id");
  CREATE INDEX "bookings_bokun_experience_id_idx" ON "bookings" USING btree ("bokun_experience_id");
  CREATE INDEX "bookings_updated_at_idx" ON "bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_tours_id_idx" ON "payload_locked_documents_rels" USING btree ("tours_id");
  CREATE INDEX "payload_locked_documents_rels_guides_id_idx" ON "payload_locked_documents_rels" USING btree ("guides_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_cities_id_idx" ON "payload_locked_documents_rels" USING btree ("cities_id");
  CREATE INDEX "payload_locked_documents_rels_neighborhoods_id_idx" ON "payload_locked_documents_rels" USING btree ("neighborhoods_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("bookings_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "tours_highlights" CASCADE;
  DROP TABLE "tours_included" CASCADE;
  DROP TABLE "tours_not_included" CASCADE;
  DROP TABLE "tours_what_to_bring" CASCADE;
  DROP TABLE "tours_target_audience" CASCADE;
  DROP TABLE "tours_images" CASCADE;
  DROP TABLE "tours_images_locales" CASCADE;
  DROP TABLE "tours" CASCADE;
  DROP TABLE "tours_locales" CASCADE;
  DROP TABLE "tours_rels" CASCADE;
  DROP TABLE "guides_credentials" CASCADE;
  DROP TABLE "guides_credentials_locales" CASCADE;
  DROP TABLE "guides_languages" CASCADE;
  DROP TABLE "guides" CASCADE;
  DROP TABLE "guides_locales" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "cities" CASCADE;
  DROP TABLE "cities_locales" CASCADE;
  DROP TABLE "neighborhoods" CASCADE;
  DROP TABLE "neighborhoods_locales" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "reviews_locales" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "bookings" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_tours_target_audience";
  DROP TYPE "public"."enum_tours_pricing_currency";
  DROP TYPE "public"."enum_tours_pricing_price_type";
  DROP TYPE "public"."enum_tours_difficulty_level";
  DROP TYPE "public"."enum_tours_availability";
  DROP TYPE "public"."enum_tours_status";
  DROP TYPE "public"."enum_guides_languages";
  DROP TYPE "public"."enum_categories_type";
  DROP TYPE "public"."enum_pages_page_type";
  DROP TYPE "public"."enum_bookings_status";
  DROP TYPE "public"."enum_bookings_last_webhook_event";`)
}
