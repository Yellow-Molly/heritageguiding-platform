import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "guides" ADD COLUMN IF NOT EXISTS "years_experience" numeric;
  `)
}

export async function down({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "guides" DROP COLUMN IF EXISTS "years_experience";
  `)
}
