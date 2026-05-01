/**
 * Loader + Zod schemas for the category taxonomy and migration map.
 *
 * Used by the migration script (Phase 03) and the standalone validator
 * (`scripts/validate-category-mapping.ts`). Re-export via this module to
 * avoid drift between the two.
 */
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

const SLUG_RE = /^[a-z0-9-]+$/

const localizedName = z.object({
  sv: z.string().min(1),
  en: z.string().min(1),
  de: z.string().min(1),
})

export const taxonomyEntrySchema = z.object({
  slug: z.string().regex(SLUG_RE),
  icon: z.string().min(1),
  name: localizedName,
})

export const taxonomySchema = z.object({
  themes: z.array(taxonomyEntrySchema).min(1),
  activities: z.array(taxonomyEntrySchema).min(1),
})

export const mapEntrySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('merge'), newSlug: z.string().regex(SLUG_RE) }),
  z.object({ action: z.literal('keep'), newSlug: z.string().regex(SLUG_RE) }),
  z.object({ action: z.literal('delete'), reason: z.string().min(1) }),
])

export const migrationMapSchema = z.record(z.string().regex(SLUG_RE), mapEntrySchema)

export type TaxonomyEntry = z.infer<typeof taxonomyEntrySchema>
export type Taxonomy = z.infer<typeof taxonomySchema>
export type MapEntry = z.infer<typeof mapEntrySchema>
export type MigrationMap = z.infer<typeof migrationMapSchema>

const TAXONOMY_PATH = path.resolve(__dirname, '../../data/category-taxonomy.json')
const MAP_PATH = path.resolve(__dirname, '../../data/category-migration-map.json')

export function loadTaxonomy(): Taxonomy {
  const raw = JSON.parse(fs.readFileSync(TAXONOMY_PATH, 'utf-8'))
  return taxonomySchema.parse(raw)
}

export function loadMigrationMap(): MigrationMap {
  const raw = JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8'))
  return migrationMapSchema.parse(raw)
}

/** All canonical slugs (themes + activities) flattened. */
export function allTaxonomySlugs(t: Taxonomy): string[] {
  return [...t.themes, ...t.activities].map((c) => c.slug)
}

/** Map slug → (themes|activities) bucket so callers can derive Payload `type`. */
export function slugTypeMap(t: Taxonomy): Map<string, 'theme' | 'activity'> {
  const m = new Map<string, 'theme' | 'activity'>()
  for (const e of t.themes) m.set(e.slug, 'theme')
  for (const e of t.activities) m.set(e.slug, 'activity')
  return m
}
