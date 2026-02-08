# Phase 02: Excel Import Service + API Route

## Context Links

- [Parent Plan](./plan.md)
- [Phase 01 - Export](./phase-01-excel-export-service.md)
- [Excel Libraries Research](./research/researcher-excel-libraries.md)
- Reference: `packages/cms/lib/csv/tour-csv-import-service.ts` (210 lines)
- Reference: `apps/web/app/api/tours/import-csv/route.ts` (103 lines)
- Reused: `packages/cms/lib/csv/tour-csv-schema-validation.ts` -- `validateCSVRow()`
- Reused: `packages/cms/lib/csv/tour-csv-column-mapping.ts` -- `csvRowToTourData()`

## Overview

- **Priority:** P2
- **Status:** Pending
- **Effort:** 2h
- **Description:** Create Excel import service that reads `.xlsx` files via ExcelJS, converts rows to `Record<string, string>` objects, then reuses existing CSV validation and tour creation logic.

## Key Insights

- CSV import works with `Record<string, string>[]` from `csv-parse` -- ExcelJS rows can produce the same shape
- `validateCSVRow(row, rowNumber)` accepts `Record<string, string>` -- format-agnostic
- `csvRowToTourData(data, relationships)` accepts `TourCSVRow` -- format-agnostic
- Relationship resolution logic (guides, categories, neighborhoods) is identical -- extract or duplicate from CSV import
- `ImportResult`, `ImportOptions`, `ImportError`, `ImportWarning` types already exported from CSV -- reuse directly
- ExcelJS reads `.xlsx` buffer via `workbook.xlsx.load(buffer)`

## Requirements

### Functional
- Import tours from `.xlsx` file uploaded via admin UI
- Read first worksheet only
- Use header row (row 1) to map columns -- match against `displayHeaders` from `getCSVHeaders()`
- Validate each row with existing `validateCSVRow()` Zod schema
- Create tours via Payload Local API (same as CSV import)
- Support `dryRun` option
- Return same `ImportResult` type as CSV import

### Non-Functional
- File under 200 lines (import service)
- Reuse existing validation and tour creation -- no duplication
- Handle empty rows gracefully (skip)

## Architecture

```
importToursFromExcel(buffer, options)
  1. Load workbook from buffer via ExcelJS
  2. Get first worksheet
  3. Extract header row (row 1) -> map displayHeaders to columnKeys
  4. For each data row (2+):
     a. Convert row cells to Record<string, string> using columnKey mapping
     b. (Remaining logic identical to CSV import)
     c. validateCSVRow(record, rowNumber)
     d. Check duplicate slugs
     e. Resolve relationships (guide, categories, neighborhoods)
     f. csvRowToTourData(data, relationships)
     g. payload.create({ collection: 'tours', data })
  5. Return ImportResult
```

### Header Mapping Strategy

The export creates headers like `"Title (Swedish)"` but the Zod schema expects keys like `"title_sv"`. Two approaches:

**Approach A (Recommended):** Build reverse map from `getCSVHeaders()`:
```typescript
const { displayHeaders, columnKeys } = getCSVHeaders()
const headerToKey = new Map(displayHeaders.map((h, i) => [h, columnKeys[i]]))
```
Then for each row, map cell values using `headerToKey` to produce `Record<string, string>` with correct keys.

**Approach B:** Require `.xlsx` to use `columnKeys` as headers (less user-friendly).

Go with **Approach A** -- it handles both human-readable headers from our export AND raw column keys as fallback.

## Related Code Files

### Files to Create
1. `packages/cms/lib/excel/tour-excel-import-service.ts` (~180 lines)
2. `apps/web/app/api/tours/import-excel/route.ts` (~100 lines)

### Files to Modify
1. `packages/cms/lib/excel/index.ts` -- add import exports

### Files to Delete
- None

## Implementation Steps

### Step 1: Create `tour-excel-import-service.ts`

Path: `packages/cms/lib/excel/tour-excel-import-service.ts`

Imports:
```typescript
import ExcelJS from 'exceljs'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { validateCSVRow, type TourCSVRow } from '../csv/tour-csv-schema-validation'
import { csvRowToTourData, getCSVHeaders } from '../csv/tour-csv-column-mapping'
import type { ImportResult, ImportOptions } from '../csv/tour-csv-import-service'

// Re-export types from CSV import
export type { ImportResult, ImportError, ImportWarning, ImportOptions } from '../csv/tour-csv-import-service'
```

Main function:
```typescript
export async function importToursFromExcel(
  buffer: Buffer,
  options: ImportOptions = {}
): Promise<ImportResult>
```

**Core logic (mirrors CSV import service exactly, lines 44-209):**

1. Parse Excel:
```typescript
const workbook = new ExcelJS.Workbook()
await workbook.xlsx.load(buffer)
const worksheet = workbook.worksheets[0]
if (!worksheet) {
  result.errors.push({ row: 0, message: 'No worksheet found in Excel file' })
  return result
}
```

2. Build header map:
```typescript
const { displayHeaders, columnKeys } = getCSVHeaders()
const displayToKey = new Map<string, string>()
displayHeaders.forEach((h, i) => displayToKey.set(h, columnKeys[i]))
// Also map columnKeys to themselves (for raw-key headers)
columnKeys.forEach((k) => displayToKey.set(k, k))
```

3. Extract header row:
```typescript
const headerRow = worksheet.getRow(1)
const colIndexToKey = new Map<number, string>()
headerRow.eachCell((cell, colNumber) => {
  const headerValue = String(cell.value || '').trim()
  const key = displayToKey.get(headerValue)
  if (key) colIndexToKey.set(colNumber, key)
})
```

4. Convert data rows to records:
```typescript
const records: Record<string, string>[] = []
worksheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return // skip header
  const record: Record<string, string> = {}
  colIndexToKey.forEach((key, colIndex) => {
    const cell = row.getCell(colIndex)
    record[key] = cell.value != null ? String(cell.value).trim() : ''
  })
  records.push(record)
})
```

5. Process records -- **copy lines 73-209 from `tour-csv-import-service.ts`** exactly:
   - Pre-fetch existing slugs for duplicate check
   - Pre-fetch guides, categories, neighborhoods for relationship resolution
   - Loop through records: validate, check duplicates, resolve relationships, create tours
   - Return `ImportResult`

**Important:** The record processing loop (lines 78-209 of CSV import) is substantial (~130 lines). To maintain DRY, consider extracting a shared helper in a future refactor. For now, duplicate this logic to keep KISS -- no risky refactoring of working CSV code.

### Step 2: Update `index.ts` barrel

Path: `packages/cms/lib/excel/index.ts`

Add imports for the new service:
```typescript
export {
  importToursFromExcel,
  type ImportResult,
  type ImportError,
  type ImportWarning,
  type ImportOptions,
} from './tour-excel-import-service'
```

### Step 3: Create API Route

Path: `apps/web/app/api/tours/import-excel/route.ts`

Mirror `import-csv/route.ts` pattern:
1. Same `verifyAdminAccess()` function
2. Parse `FormData`, get `file` and `dryRun`
3. Validate file extension: `.xlsx`
4. Validate file size: 50MB max
5. Read as buffer: `Buffer.from(await file.arrayBuffer())`
6. Call `importToursFromExcel(buffer, { dryRun })`
7. Return JSON response with `ImportResult`

Key difference from CSV route:
```typescript
// CSV uses: const csvContent = await file.text()
// Excel uses: const buffer = Buffer.from(await file.arrayBuffer())
```

File extension validation:
```typescript
if (!file.name.toLowerCase().endsWith('.xlsx')) {
  return NextResponse.json(
    { error: 'File must be an Excel file (.xlsx)' },
    { status: 400 }
  )
}
```

### Step 4: Verify Build

```bash
npm run build
```

### Step 5: Test Import Flow

1. Export tours via Excel (Phase 01)
2. Import the same `.xlsx` file with `dryRun: true`
3. Verify all rows validate without errors
4. Verify created count matches exported tour count

## Unit Tests

### File: `packages/cms/__tests__/tour-excel-import-service.test.ts`

Test import service logic (mock Payload, provide ExcelJS-generated buffers):

1. **Parses valid XLSX and returns records** - Create XLSX buffer with valid tour data, verify `importToursFromExcel()` returns `created > 0`
2. **Dry run does not create tours** - Call with `dryRun: true`, verify `payload.create` not called but `created` count correct
3. **Handles empty worksheet** - XLSX with header row only, verify warning returned
4. **Validates required fields** - XLSX missing `slug` or `title_sv`, verify row-level validation errors
5. **Skips duplicate slugs** - Mock existing tours with matching slugs, verify `skipped > 0` with warnings
6. **Resolves guide relationship** - XLSX with `guide_slug`, verify guide ID resolved via mock
7. **Reports missing guide** - XLSX with non-existent `guide_slug`, verify error with row number
8. **Fuzzy header matching** - XLSX with headers like `"title (swedish)"` (lowercase), verify correctly mapped to `title_sv`
9. **Handles both display headers and raw column keys** - XLSX with `Title (Swedish)` and `title_sv` both work
10. **Handles ExcelJS cell types** - Numbers, booleans, dates coerced to strings correctly

### File: `packages/cms/__tests__/tour-import-shared-record-processor.test.ts`

Test the extracted shared helper (if extracted per validation decision):

1. **Processes valid records** - Verify tour creation with correct data
2. **Handles relationship resolution** - Guide, categories, neighborhoods
3. **Returns correct ImportResult shape** - created, skipped, errors, warnings counts

### Approach
- Build XLSX buffers programmatically using ExcelJS in test setup
- Mock `getPayload` to control `find()` and `create()` calls
- Reuse mock patterns from `tour-csv-schema-validation.test.ts`

## Todo List

- [ ] Extract shared `processImportRecords()` helper from CSV import
- [ ] Refactor CSV import to use shared helper
- [ ] Create `packages/cms/lib/excel/tour-excel-import-service.ts`
- [ ] Update `packages/cms/lib/excel/index.ts` with import exports
- [ ] Create `apps/web/app/api/tours/import-excel/route.ts`
- [ ] Implement fuzzy header matching
- [ ] Create `packages/cms/__tests__/tour-excel-import-service.test.ts`
- [ ] Create `packages/cms/__tests__/tour-import-shared-record-processor.test.ts`
- [ ] Verify build passes
- [ ] Verify all tests pass (`npm test`)

## Success Criteria

- `POST /api/tours/import-excel` accepts `.xlsx` upload and returns `ImportResult`
- Dry run validates without creating tours
- Real import creates tours identical to CSV import
- Error reporting matches CSV import format (row numbers, field names, messages)
- Re-importing exported file with existing slugs produces skip warnings (not errors)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Header name mismatch between export/import | Low | High | Both use `getCSVHeaders()` -- guaranteed match |
| ExcelJS cell value type coercion issues | Medium | Medium | Force `String(cell.value)` on all cells |
| Duplicated import logic with CSV | Medium | Low | Acceptable trade-off for KISS. Refactor later if needed. |
| Large `.xlsx` files causing memory issues | Low | Medium | 50MB limit. ExcelJS handles moderate files well. |

## Security Considerations

- Admin auth required (same pattern as CSV import route)
- File size validation (50MB max)
- File extension validation (`.xlsx` only)
- No file system writes -- buffer processed in memory
- Input validated through existing Zod schema before any DB writes

## Next Steps

- Phase 03: Admin UI buttons for Excel export/import
- Future: Extract shared record-processing logic from CSV/Excel import into a common helper (DRY refactor)
