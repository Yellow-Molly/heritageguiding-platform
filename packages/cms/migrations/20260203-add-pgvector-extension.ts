/**
 * Migration: Add pgvector extension and tour_embeddings table
 * Enables semantic/natural language search for tours using vector similarity
 */

import { sql } from 'drizzle-orm'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Enable pgvector extension for vector similarity search
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`)

  // Create tour_embeddings table for storing OpenAI embeddings
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tour_embeddings (
      id SERIAL PRIMARY KEY,
      tour_id INTEGER NOT NULL,
      embedding vector(1536),
      embedding_model TEXT DEFAULT 'text-embedding-3-small',
      content_hash TEXT,
      locale TEXT DEFAULT 'en',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(tour_id, locale)
    )
  `)

  // Create HNSW index for fast approximate nearest neighbor search
  // m=16: number of bi-directional links (higher = better recall, more memory)
  // ef_construction=64: size of dynamic candidate list for construction (higher = better quality, slower build)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS tour_embeddings_hnsw_idx
    ON tour_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
  `)

  // Add index for locale lookups
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS tour_embeddings_locale_idx
    ON tour_embeddings (locale)
  `)

  // Add index for content hash lookups (change detection)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS tour_embeddings_hash_idx
    ON tour_embeddings (tour_id, content_hash)
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS tour_embeddings_hash_idx`)
  await db.execute(sql`DROP INDEX IF EXISTS tour_embeddings_locale_idx`)
  await db.execute(sql`DROP INDEX IF EXISTS tour_embeddings_hnsw_idx`)
  await db.execute(sql`DROP TABLE IF EXISTS tour_embeddings`)
  // Note: Not dropping vector extension as other tables may use it
}
