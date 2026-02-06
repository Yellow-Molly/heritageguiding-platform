# Phase 01: CSV Export Service

## Context Links

- [Plan Overview](./plan.md)
- [CSV Libraries Research](./research/researcher-csv-libraries.md)
- [Tours Collection](../../packages/cms/collections/tours.ts)
- [Code Standards](../../docs/code-standards.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P2 | Code Review Complete - Minor Fix Needed | 2h |

Build server-side export service that converts Tours collection data to CSV format with flattened columns and UTF-8 BOM for Excel compatibility.

**Code Review:** [Report](../reports/code-reviewer-260205-1802-tours-csv-export.md) | **Quality Rating:** 8.5/10 | **Action Required:** Remove unused variable

## Key Insights

- Use `csv-stringify` for reliable streaming output
- UTF-8 BOM required for Excel to recognize Swedish/German characters
- Flatten nested groups with underscore notation (`pricing_basePrice`)
- Localized fields need 3 columns each (`title_sv`, `title_en`, `title_de`)
- Rich text (Lexical JSON) should export as plain text or markdown

## Requirements

### Functional
- Export all tours or filtered subset
- Include all fields with proper column naming
- Handle relationships by exporting slugs/names
- Support UTF-8 with BOM for Excel compatibility

### Non-Functional
- Streaming for large datasets (>1000 tours)
- Response time <5s for typical dataset
- Memory-efficient (no full load into memory)

## Architecture

```
packages/cms/lib/csv/
├── tour-csv-column-mapping.ts      # Column definitions + flattening logic
├── tour-csv-export-service.ts      # Export orchestration
└── index.ts                        # Exports

apps/web/app/api/tours/export-csv/
└── route.ts                        # GET endpoint
```

## CSV Column Mapping

### Basic Fields
| Tour Field | CSV Column | Type |
|------------|------------|------|
| title | title_sv, title_en, title_de | localized text |
| slug | slug | text |
| shortDescription | shortDescription_sv, shortDescription_en, shortDescription_de | localized text |
| description | description_sv, description_en, description_de | localized richtext -> markdown |
| highlights | highlights_sv, highlights_en, highlights_de | localized array -> semicolon-separated |

### Pricing Group
| Tour Field | CSV Column | Type |
|------------|------------|------|
| pricing.basePrice | pricing_basePrice | number |
| pricing.currency | pricing_currency | select (SEK/EUR/USD) |
| pricing.priceType | pricing_priceType | select |
| pricing.groupDiscount | pricing_groupDiscount | boolean (true/false) |
| pricing.childPrice | pricing_childPrice | number |

### Duration Group
| Tour Field | CSV Column | Type |
|------------|------------|------|
| duration.hours | duration_hours | number |
| duration.durationText | duration_durationText_sv, _en, _de | localized text |

### Logistics Group
| Tour Field | CSV Column | Type |
|------------|------------|------|
| logistics.meetingPointName | logistics_meetingPointName_sv, _en, _de | localized text |
| logistics.meetingPointAddress | logistics_meetingPointAddress_sv, _en, _de | localized text |
| logistics.coordinates | logistics_coordinates | "lat,lng" |
| logistics.googleMapsLink | logistics_googleMapsLink | text |
| logistics.meetingPointInstructions | logistics_meetingPointInstructions_sv, _en, _de | localized textarea |
| logistics.endingPoint | logistics_endingPoint_sv, _en, _de | localized text |
| logistics.parkingInfo | logistics_parkingInfo_sv, _en, _de | localized textarea |
| logistics.publicTransportInfo | logistics_publicTransportInfo_sv, _en, _de | localized textarea |

### Relationships
| Tour Field | CSV Column | Type |
|------------|------------|------|
| guide | guide_slug | relationship -> slug |
| categories | categories | hasMany -> semicolon-separated slugs |
| neighborhoods | neighborhoods | hasMany -> semicolon-separated slugs |
| images | images | array -> semicolon-separated URLs |

### Status/Meta
| Tour Field | CSV Column | Type |
|------------|------------|------|
| bokunExperienceId | bokunExperienceId | text |
| availability | availability | select |
| maxGroupSize | maxGroupSize | number |
| minGroupSize | minGroupSize | number |
| featured | featured | boolean |
| status | status | select |

### Audience & Difficulty
| Tour Field | CSV Column | Type |
|------------|------------|------|
| targetAudience | targetAudience | multi-select -> semicolon-separated |
| difficultyLevel | difficultyLevel | select |
| ageRecommendation.minimumAge | ageRecommendation_minimumAge | number |
| ageRecommendation.childFriendly | ageRecommendation_childFriendly | boolean |
| ageRecommendation.teenFriendly | ageRecommendation_teenFriendly | boolean |

### Accessibility Group
| Tour Field | CSV Column | Type |
|------------|------------|------|
| accessibility.wheelchairAccessible | accessibility_wheelchairAccessible | boolean |
| accessibility.mobilityNotes | accessibility_mobilityNotes_sv, _en, _de | localized textarea |
| accessibility.hearingAssistance | accessibility_hearingAssistance | boolean |
| accessibility.visualAssistance | accessibility_visualAssistance | boolean |
| accessibility.serviceAnimalsAllowed | accessibility_serviceAnimalsAllowed | boolean |

### Inclusions (localized arrays)
| Tour Field | CSV Column | Type |
|------------|------------|------|
| included | included_sv, included_en, included_de | array -> semicolon-separated |
| notIncluded | notIncluded_sv, notIncluded_en, notIncluded_de | array -> semicolon-separated |
| whatToBring | whatToBring_sv, whatToBring_en, whatToBring_de | array -> semicolon-separated |

## Related Code Files

### Files to Create
- `packages/cms/lib/csv/tour-csv-column-mapping.ts` - Column definitions
- `packages/cms/lib/csv/tour-csv-export-service.ts` - Export service
- `packages/cms/lib/csv/index.ts` - Module exports
- `apps/web/app/api/tours/export-csv/route.ts` - API endpoint

### Files to Modify
- `apps/web/package.json` - Add csv-stringify dependency

## Implementation Steps

### Step 1: Install Dependencies
```bash
cd apps/web && npm install csv-stringify
```

### Step 2: Create Column Mapping Module
```typescript
// packages/cms/lib/csv/tour-csv-column-mapping.ts
export const LOCALES = ['sv', 'en', 'de'] as const

export interface CSVColumnDefinition {
  csvColumn: string
  tourPath: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'array' | 'relationship' | 'richtext' | 'point'
  localized?: boolean
}

// Define all column mappings here
export const TOUR_CSV_COLUMNS: CSVColumnDefinition[] = [
  // Basic fields
  { csvColumn: 'slug', tourPath: 'slug', type: 'text' },
  { csvColumn: 'title', tourPath: 'title', type: 'text', localized: true },
  // ... all other columns
]

export function getCSVHeaders(): string[] {
  // Generate full header list with locale suffixes
}

export function flattenTourToCSVRow(tour: Tour): Record<string, string> {
  // Convert tour object to flat CSV row
}
```

### Step 3: Create Export Service
```typescript
// packages/cms/lib/csv/tour-csv-export-service.ts
import { stringify } from 'csv-stringify'
import { getPayload } from 'payload'
import { getCSVHeaders, flattenTourToCSVRow } from './tour-csv-column-mapping'

export async function exportToursToCSV(): Promise<string> {
  const payload = await getPayload({ config })

  // Fetch all tours with depth for relationships
  const { docs: tours } = await payload.find({
    collection: 'tours',
    limit: 10000,
    depth: 2,
    locale: 'all', // Get all locales
  })

  // Flatten each tour to CSV row
  const rows = tours.map(flattenTourToCSVRow)

  // Generate CSV with UTF-8 BOM
  return new Promise((resolve, reject) => {
    stringify(rows, {
      header: true,
      columns: getCSVHeaders(),
      bom: true, // UTF-8 BOM for Excel
    }, (err, output) => {
      if (err) reject(err)
      else resolve(output)
    })
  })
}
```

### Step 4: Create API Route
```typescript
// apps/web/app/api/tours/export-csv/route.ts
import { NextResponse } from 'next/server'
import { exportToursToCSV } from '@cms/lib/csv'
import { verifyAdminAccess } from '@/lib/auth-check'

export async function GET() {
  try {
    await verifyAdminAccess()

    const csv = await exportToursToCSV()
    const filename = `tours-export-${new Date().toISOString().slice(0,10)}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
```

### Step 5: Handle Rich Text Conversion
```typescript
// Convert Lexical JSON to plain text/markdown for CSV export
function lexicalToPlainText(lexicalJson: any): string {
  if (!lexicalJson?.root?.children) return ''

  return lexicalJson.root.children
    .map((node: any) => extractTextFromNode(node))
    .join('\n\n')
}

function extractTextFromNode(node: any): string {
  if (node.type === 'text') return node.text || ''
  if (node.children) return node.children.map(extractTextFromNode).join('')
  return ''
}
```

## Todo List

- [x] Install csv-stringify dependency
- [x] Create tour-csv-column-mapping.ts with all field definitions
- [x] Create tour-csv-export-service.ts with export logic
- [x] Create auth verification helper
- [x] Create API route /api/tours/export-csv
- [x] Handle Lexical JSON to plain text conversion
- [x] Handle point type (coordinates) formatting
- [x] Handle relationship slug extraction
- [x] Add UTF-8 BOM for Excel compatibility
- [x] Test with Swedish/German characters (unit tests)
- [x] Test with sample tour data (unit tests)

## Success Criteria

- [x] CSV downloads with correct filename and headers
- [x] All tour fields exported with proper column names
- [x] Localized fields have _sv, _en, _de suffixes
- [x] Arrays exported as semicolon-separated values
- [x] Relationships exported as slugs
- [x] UTF-8 characters preserved (Swedish: aao, German: umlaut)
- [ ] Excel opens file correctly without encoding issues (requires manual test)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Large dataset memory issues | Use streaming stringify |
| Rich text formatting loss | Convert to markdown, document limitation |
| Missing relationships | Handle null/undefined gracefully |
| Excel encoding issues | UTF-8 BOM header |

## Security Considerations

- Admin-only access via Payload auth token verification
- No sensitive data in CSV (no user passwords, API keys)
- Rate limiting on export endpoint (prevent abuse)

## Code Review Findings (2026-02-05)

### Issues to Fix
1. **Unused Variable (Medium):** Remove `cookieHeader` variable in `route.ts:24` (ESLint warning)
2. **Manual Test Pending:** Excel test with Swedish/German characters not yet verified

### Recommendations
1. Add try-catch with logging in `exportToursToCSV` for better debugging
2. Add limit validation (max 10000) to prevent memory issues
3. Consider implementing rate limiting mentioned in Security Considerations

### Positive Highlights
- Excellent test coverage (35 tests, 100% pass)
- Strong type safety throughout
- Comprehensive field coverage (191 columns)
- Proper edge case handling
- Security best practices implemented

## Next Steps

After Phase 01 fixes:
- Fix unused variable warning
- Perform manual Excel test
- Phase 02: CSV Import Service (reverse mapping + validation)
- Phase 03: Admin UI components
