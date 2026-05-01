import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tours_rels" ADD COLUMN "cities_id" integer;
  ALTER TABLE "tours_rels" ADD CONSTRAINT "tours_rels_cities_fk" FOREIGN KEY ("cities_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tours_rels_cities_id_idx" ON "tours_rels" USING btree ("cities_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tours_rels" DROP CONSTRAINT "tours_rels_cities_fk";
  
  DROP INDEX "tours_rels_cities_id_idx";
  ALTER TABLE "tours_rels" DROP COLUMN "cities_id";`)
}
