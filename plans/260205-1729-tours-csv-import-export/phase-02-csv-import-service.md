# Phase 02: CSV Import Service

## Context Links

- [Plan Overview](./plan.md)
- [Phase 01: Export Service](./phase-01-csv-export-service.md)
- [CSV Libraries Research](./research/researcher-csv-libraries.md)
- [Tours Collection](../../packages/cms/collections/tours.ts)
- [Code Standards](../../docs/code-standards.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P2 | pending | 3h |

Build server-side import service that parses CSV files, validates data with Zod schemas, and creates new tours via Payload Local API. Create-only mode (no updates).

## Key Insights

- Use `csv-parse` for reliable streaming parsing
- Zod validation per row with detailed error reporting
- Create-only mode: skip rows with existing slugs (safer approach)
- Rich text fields accept markdown, convert to Lexical JSON
- Relationships resolved by slug lookup
- Row-level error reporting with line numbers

## Requirements

### Functional
- Parse CSV with header row detection
- Validate each row against Zod schema
- Create tours only (no update/overwrite)
- Skip rows with duplicate slugs (report as warning)
- Resolve relationships by slug (guide, categories, neighborhoods)
- Convert markdown to Lexical JSON for rich text fields
- Return detailed import results (created, skipped, errors)

### Non-Functional
- Handle files up to 50MB
- Process 500+ rows efficiently
- Memory-efficient streaming parse
- Clear error messages with row numbers

## Architecture

```
packages/cms/lib/csv/
├── tour-csv-column-mapping.ts        # (from Phase 01)
├── tour-csv-schema-validation.ts     # Zod schemas for CSV rows
├── tour-csv-import-service.ts        # Import orchestration
├── tour-csv-markdown-to-lexical.ts   # Markdown -> Lexical conversion
└── index.ts                          # Exports

apps/web/app/api/tours/import-csv/
└── route.ts                          # POST endpoint
```

## CSV Row Validation Schema

```typescript
// packages/cms/lib/csv/tour-csv-schema-validation.ts
import { z } from 'zod'

// Required fields schema
export const tourCSVRowSchema = z.object({
  // Required fields
  slug: z.string().min(1, 'Slug is required'),
  title_sv: z.string().min(1, 'Swedish title required'),
  shortDescription_sv: z.string().min(1).max(160),
  pricing_basePrice: z.coerce.number().min(0),
  pricing_priceType: z.enum(['per_person', 'per_group', 'custom']),
  duration_hours: z.coerce.number().min(0.5),
  guide_slug: z.string().min(1, 'Guide slug required'),
  logistics_meetingPointName_sv: z.string().min(1),

  // Optional localized fields
  title_en: z.string().optional(),
  title_de: z.string().optional(),
  shortDescription_en: z.string().max(160).optional(),
  shortDescription_de: z.string().max(160).optional(),
  description_sv: z.string().optional(),
  description_en: z.string().optional(),
  description_de: z.string().optional(),

  // Optional fields with defaults
  pricing_currency: z.enum(['SEK', 'EUR', 'USD']).default('SEK'),
  pricing_groupDiscount: z.coerce.boolean().default(false),
  pricing_childPrice: z.coerce.number().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  featured: z.coerce.boolean().default(false),
  availability: z.enum(['available', 'seasonal', 'by_request', 'unavailable']).default('available'),

  // ... all other fields
}).passthrough() // Allow extra columns
```

## Related Code Files

### Files to Create
- `packages/cms/lib/csv/tour-csv-schema-validation.ts` - Zod schemas
- `packages/cms/lib/csv/tour-csv-import-service.ts` - Import service
- `packages/cms/lib/csv/tour-csv-markdown-to-lexical.ts` - Markdown conversion
- `apps/web/app/api/tours/import-csv/route.ts` - API endpoint

### Files to Modify
- `packages/cms/lib/csv/index.ts` - Add new exports
- `apps/web/package.json` - Add csv-parse dependency

## Implementation Steps

### Step 1: Install Dependencies
```bash
cd apps/web && npm install csv-parse
```

### Step 2: Create Validation Schema
```typescript
// packages/cms/lib/csv/tour-csv-schema-validation.ts
import { z } from 'zod'

// Helper for semicolon-separated arrays
const semicolonArray = z.string().transform(val =>
  val ? val.split(';').map(s => s.trim()).filter(Boolean) : []
)

// Helper for coordinates
const coordinatesSchema = z.string().optional().transform(val => {
  if (!val) return undefined
  const [lat, lng] = val.split(',').map(s => parseFloat(s.trim()))
  return !isNaN(lat) && !isNaN(lng) ? [lng, lat] : undefined // GeoJSON format
})

// Helper for boolean from string
const booleanString = z.string().transform(val =>
  val?.toLowerCase() === 'true' || val === '1'
)

export const tourCSVRowSchema = z.object({
  // === REQUIRED ===
  slug: z.string().min(1, 'Slug required'),
  title_sv: z.string().min(1, 'Swedish title required'),
  shortDescription_sv: z.string().min(1).max(160, 'Max 160 chars'),
  pricing_basePrice: z.coerce.number().min(0, 'Price must be >= 0'),
  pricing_priceType: z.enum(['per_person', 'per_group', 'custom']),
  duration_hours: z.coerce.number().min(0.5, 'Min 0.5 hours'),
  guide_slug: z.string().min(1, 'Guide slug required'),
  logistics_meetingPointName_sv: z.string().min(1, 'Meeting point required'),

  // === OPTIONAL LOCALIZED ===
  title_en: z.string().optional(),
  title_de: z.string().optional(),
  // ... more localized fields

  // === OPTIONAL WITH DEFAULTS ===
  pricing_currency: z.enum(['SEK', 'EUR', 'USD']).default('SEK'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  featured: booleanString.default('false'),

  // === ARRAYS ===
  categories: semicolonArray.optional(),
  neighborhoods: semicolonArray.optional(),
  highlights_sv: semicolonArray.optional(),
  targetAudience: semicolonArray.optional(),

  // === SPECIAL TYPES ===
  logistics_coordinates: coordinatesSchema,
})

export type TourCSVRow = z.infer<typeof tourCSVRowSchema>

export function validateCSVRow(row: Record<string, string>, rowNumber: number) {
  const result = tourCSVRowSchema.safeParse(row)
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors.map(e => ({
        row: rowNumber,
        field: e.path.join('.'),
        message: e.message,
      })),
    }
  }
  return { valid: true, data: result.data }
}
```

### Step 3: Create Markdown to Lexical Converter
```typescript
// packages/cms/lib/csv/tour-csv-markdown-to-lexical.ts

/**
 * Simple markdown to Lexical JSON converter
 * Handles: paragraphs, headings, bold, italic, links
 */
export function markdownToLexical(markdown: string): object {
  if (!markdown) return createEmptyLexical()

  const paragraphs = markdown.split('\n\n').filter(Boolean)

  const children = paragraphs.map(p => {
    // Heading detection
    if (p.startsWith('# ')) return createHeading(p.slice(2), 1)
    if (p.startsWith('## ')) return createHeading(p.slice(3), 2)
    if (p.startsWith('### ')) return createHeading(p.slice(4), 3)

    // Regular paragraph with inline formatting
    return createParagraph(p)
  })

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr',
    },
  }
}

function createEmptyLexical() {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [],
      direction: 'ltr',
    },
  }
}

function createParagraph(text: string) {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: parseInlineFormatting(text),
    direction: 'ltr',
  }
}

function createHeading(text: string, level: number) {
  return {
    type: 'heading',
    tag: `h${level}`,
    format: '',
    indent: 0,
    version: 1,
    children: parseInlineFormatting(text),
    direction: 'ltr',
  }
}

function parseInlineFormatting(text: string) {
  // Simple: just create text node (extend for bold/italic if needed)
  return [{ type: 'text', text, format: 0, version: 1 }]
}
```

### Step 4: Create Import Service
```typescript
// packages/cms/lib/csv/tour-csv-import-service.ts
import { parse } from 'csv-parse/sync'
import { getPayload } from 'payload'
import config from '@cms/payload.config'
import { validateCSVRow } from './tour-csv-schema-validation'
import { csvRowToTourData } from './tour-csv-column-mapping'

export interface ImportResult {
  created: number
  skipped: number
  errors: { row: number; field?: string; message: string }[]
  warnings: { row: number; message: string }[]
}

export async function importToursFromCSV(csvContent: string): Promise<ImportResult> {
  const payload = await getPayload({ config })

  // Parse CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true, // Handle UTF-8 BOM
  })

  const result: ImportResult = {
    created: 0,
    skipped: 0,
    errors: [],
    warnings: [],
  }

  // Pre-fetch existing slugs for duplicate check
  const { docs: existingTours } = await payload.find({
    collection: 'tours',
    limit: 10000,
    select: { slug: true },
  })
  const existingSlugs = new Set(existingTours.map(t => t.slug))

  // Pre-fetch guides for relationship resolution
  const { docs: guides } = await payload.find({
    collection: 'guides',
    limit: 1000,
  })
  const guideMap = new Map(guides.map(g => [g.slug, g.id]))

  // Pre-fetch categories
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 100,
  })
  const categoryMap = new Map(categories.map(c => [c.slug, c.id]))

  // Pre-fetch neighborhoods
  const { docs: neighborhoods } = await payload.find({
    collection: 'neighborhoods',
    limit: 100,
  })
  const neighborhoodMap = new Map(neighborhoods.map(n => [n.slug, n.id]))

  // Process each row
  for (let i = 0; i < records.length; i++) {
    const rowNumber = i + 2 // +2 for 1-indexed + header row
    const row = records[i]

    // Validate row
    const validation = validateCSVRow(row, rowNumber)
    if (!validation.valid) {
      result.errors.push(...validation.errors)
      continue
    }

    const data = validation.data

    // Check for duplicate slug
    if (existingSlugs.has(data.slug)) {
      result.warnings.push({
        row: rowNumber,
        message: `Slug "${data.slug}" already exists, skipping`,
      })
      result.skipped++
      continue
    }

    // Resolve guide relationship
    const guideId = guideMap.get(data.guide_slug)
    if (!guideId) {
      result.errors.push({
        row: rowNumber,
        field: 'guide_slug',
        message: `Guide "${data.guide_slug}" not found`,
      })
      continue
    }

    // Resolve category relationships
    const categoryIds = (data.categories || [])
      .map(slug => categoryMap.get(slug))
      .filter(Boolean)

    // Resolve neighborhood relationships
    const neighborhoodIds = (data.neighborhoods || [])
      .map(slug => neighborhoodMap.get(slug))
      .filter(Boolean)

    try {
      // Convert CSV row to tour data structure
      const tourData = csvRowToTourData(data, {
        guideId,
        categoryIds,
        neighborhoodIds,
      })

      // Create tour
      await payload.create({
        collection: 'tours',
        data: tourData,
      })

      result.created++
      existingSlugs.add(data.slug) // Track newly created
    } catch (error) {
      result.errors.push({
        row: rowNumber,
        message: `Create failed: ${error.message}`,
      })
    }
  }

  return result
}
```

### Step 5: Create API Route
```typescript
// apps/web/app/api/tours/import-csv/route.ts
import { NextResponse } from 'next/server'
import { importToursFromCSV } from '@cms/lib/csv'
import { verifyAdminAccess } from '@/lib/auth-check'

export async function POST(request: Request) {
  try {
    await verifyAdminAccess()

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      )
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 50MB)' },
        { status: 400 }
      )
    }

    const csvContent = await file.text()
    const result = await importToursFromCSV(csvContent)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Import failed', details: error.message },
      { status: 500 }
    )
  }
}
```

### Step 6: Add csvRowToTourData Function
```typescript
// In tour-csv-column-mapping.ts - add this function

export function csvRowToTourData(
  row: TourCSVRow,
  relationships: {
    guideId: string
    categoryIds: string[]
    neighborhoodIds: string[]
  }
) {
  return {
    slug: row.slug,
    title: {
      sv: row.title_sv,
      en: row.title_en || row.title_sv,
      de: row.title_de || row.title_sv,
    },
    shortDescription: {
      sv: row.shortDescription_sv,
      en: row.shortDescription_en || row.shortDescription_sv,
      de: row.shortDescription_de || row.shortDescription_sv,
    },
    description: {
      sv: markdownToLexical(row.description_sv || ''),
      en: markdownToLexical(row.description_en || row.description_sv || ''),
      de: markdownToLexical(row.description_de || row.description_sv || ''),
    },
    highlights: row.highlights_sv?.map(h => ({ highlight: h })) || [],
    pricing: {
      basePrice: row.pricing_basePrice,
      currency: row.pricing_currency,
      priceType: row.pricing_priceType,
      groupDiscount: row.pricing_groupDiscount,
      childPrice: row.pricing_childPrice,
    },
    duration: {
      hours: row.duration_hours,
      durationText: {
        sv: row.duration_durationText_sv,
        en: row.duration_durationText_en,
        de: row.duration_durationText_de,
      },
    },
    logistics: {
      meetingPointName: {
        sv: row.logistics_meetingPointName_sv,
        en: row.logistics_meetingPointName_en || row.logistics_meetingPointName_sv,
        de: row.logistics_meetingPointName_de || row.logistics_meetingPointName_sv,
      },
      coordinates: row.logistics_coordinates,
      googleMapsLink: row.logistics_googleMapsLink,
      // ... other logistics fields
    },
    guide: relationships.guideId,
    categories: relationships.categoryIds,
    neighborhoods: relationships.neighborhoodIds,
    status: row.status,
    featured: row.featured,
    availability: row.availability,
    targetAudience: row.targetAudience,
    // ... other fields
  }
}
```

## Todo List

- [ ] Install csv-parse dependency
- [ ] Create tour-csv-schema-validation.ts with Zod schemas
- [ ] Create tour-csv-markdown-to-lexical.ts converter
- [ ] Create tour-csv-import-service.ts with full logic
- [ ] Add csvRowToTourData function to column mapping
- [ ] Create API route /api/tours/import-csv
- [ ] Handle relationship resolution (guide, categories, neighborhoods)
- [ ] Implement duplicate slug detection (skip with warning)
- [ ] Add file validation (type, size)
- [ ] Test with sample CSV file
- [ ] Test error handling (missing required fields, invalid data)
- [ ] Test UTF-8 encoding with Swedish/German characters

## Success Criteria

- [ ] CSV parses correctly with headers detected
- [ ] Validation errors include row numbers and field names
- [ ] Duplicate slugs skipped with warning (not error)
- [ ] Guide relationship resolved by slug
- [ ] Categories/neighborhoods resolved by slugs
- [ ] Rich text converted from markdown to Lexical JSON
- [ ] Created tours have all fields populated correctly
- [ ] Import report shows created, skipped, errors counts
- [ ] Large files (500+ rows) process without memory issues

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Invalid CSV format | csv-parse handles malformed CSV gracefully |
| Missing relationships | Pre-fetch all and report missing as errors |
| Partial import failures | Transaction-like: report all errors, don't rollback successful |
| Memory issues large files | Streaming parse, process row-by-row |
| Encoding issues | BOM detection, UTF-8 default |

## Security Considerations

- Admin-only access via Payload auth verification
- File type validation (.csv only)
- File size limit (50MB)
- No code execution from CSV content
- Sanitize all string inputs before database insert

## Next Steps

After Phase 02 complete:
- Phase 03: Admin UI components with import/export buttons
