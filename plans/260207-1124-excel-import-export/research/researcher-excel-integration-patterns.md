# Excel Integration Patterns Research Report

**Date:** 2026-02-07
**Context:** Extending existing CSV import/export system to support Excel (.xlsx) format
**Token Budget:** High efficiency, max 150 lines

## Executive Summary

Research identifies **shared abstraction pattern** as optimal approach. Use ExcelJS for formatting control, file-type library for detection, and zod-xlsx wrapper to reuse existing Zod schemas.

---

## 1. Architectural Pattern: Shared vs Parallel Services

### Recommendation: **Shared Abstraction with Format-Specific Adapters**

**Pattern:**
```
BaseExportService (abstract)
  ├─ CsvExportAdapter
  └─ ExcelExportAdapter

BaseImportService (abstract)
  ├─ CsvImportAdapter
  └─ ExcelImportAdapter
```

**Benefits:**
- Single column mapping config reused across formats
- Unified validation pipeline (Zod schemas)
- Format detection layer delegates to appropriate adapter
- DRY: Core logic (relationship resolution, flattening) shared

**Implementation:**
- Create `tour-export-service-base.ts` with abstract `serialize()` method
- CSV adapter calls csv-stringify
- Excel adapter calls ExcelJS
- Both use same column mapping & validation

**Source:** [Universal Exporter TypeScript Pattern](https://dev.to/m4r14/creating-a-universal-exporter-in-typescript-for-csv-json-and-excel-formats-3mil)

---

## 2. Excel Formatting Best Practices

### Library: **ExcelJS** (Not SheetJS)

**Rationale:**
- ExcelJS: Native styling/formatting support
- SheetJS (xlsx): Community edition lacks styling, requires xlsx-style fork
- ExcelJS actively maintained, better TypeScript support

**Key Formatting Features:**

```typescript
// Column widths - content-aware
worksheet.columns = [
  { header: 'Tour Name', key: 'name', width: 30 },
  { header: 'Duration', key: 'duration', width: 15 }
];

// Header styles
worksheet.getRow(1).font = { bold: true, size: 12 };
worksheet.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE0E0E0' }
};

// Data validation (dropdowns)
worksheet.getCell('C2').dataValidation = {
  type: 'list',
  allowBlank: false,
  formulae: ['"Easy,Moderate,Difficult"']
};
```

**Auto-width Strategy:**
- Iterate columns after data write
- Calculate max(header.length, max(cell_values.length)) * 1.2
- Set min width: 10, max width: 50

**Sources:**
- [ExcelJS GitHub](https://github.com/exceljs/exceljs)
- [Mastering ExcelJS Guide](https://habtesoft.medium.com/mastering-exceljs-advanced-excel-operations-in-node-js-0ff859384257)
- [SheetJS vs ExcelJS Comparison](https://copyprogramming.com/howto/sheetjs-xlsx-style-need-cell-style-in-excel)

---

## 3. File Type Detection for Unified Endpoint

### Strategy: **Magic Bytes + Extension Fallback**

**Libraries:**
- `file-type` (npm) - detects format from buffer
- `multer` - multipart/form-data parsing

**Implementation:**

```typescript
// POST /api/tours/import
const buffer = await file.arrayBuffer();
const fileType = await fileTypeFromBuffer(Buffer.from(buffer));

if (fileType?.mime === 'text/csv' || file.name.endsWith('.csv')) {
  return csvImportService.parse(buffer);
}
if (fileType?.mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
  return excelImportService.parse(buffer);
}

throw new Error('Unsupported format. Upload CSV or XLSX.');
```

**Content-Type Headers:**
- CSV uploads: `text/csv`
- XLSX uploads: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**In-Memory Parsing:**
- No disk writes (security)
- Stream-based parsing for large files
- NestJS example: Custom Multer storage engine with exceljs/csv-parse

**Source:** [NestJS CSV/XLSX Upload](https://dev.to/damir_maham/streamline-file-uploads-in-nestjs-efficient-in-memory-parsing-for-csv-xlsx-without-disk-storage-145g)

---

## 4. MIME Types for .xlsx Downloads

### Standard: **application/vnd.openxmlformats-officedocument.spreadsheetml.sheet**

**Response Headers:**

```typescript
return new Response(excelBuffer, {
  headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="tours-export.xlsx"',
    'Content-Length': excelBuffer.length.toString()
  }
});
```

**Legacy vs Modern:**
- `.xls` (Excel 97-2003): `application/vnd.ms-excel`
- `.xlsx` (Excel 2007+): `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Benefits of .xlsx:**
- Smaller file sizes (ZIP compression)
- Better data recovery
- Supports 1M+ rows (vs 65K in .xls)

**Sources:**
- [XLSX MIME Type Guide](https://www.oreateai.com/blog/understanding-xls-mime-types-a-guide-for-developers/14f7e518a1c0f69941df6c76dbc6db9a)
- [MDN Common MIME Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types/Common_types)

---

## 5. Reusing Zod Schemas for Excel

### Solution: **zod-xlsx Wrapper**

**Library:** `zod-xlsx` (npm)
- Wraps existing Zod schemas
- Column mapping via header names
- Same validation logic as CSV

**Implementation:**

```typescript
// Existing CSV schema (already in codebase)
const tourSchema = z.object({
  'Tour Name': z.string().min(1),
  'Duration (hours)': z.coerce.number(),
  'Difficulty': z.enum(['Easy', 'Moderate', 'Difficult']),
  'Categories': z.string() // comma-separated IDs
});

// Excel validation (reuses schema)
import { createValidator } from 'zod-xlsx';
const workbook = XLSX.read(buffer);
const validator = createValidator(workbook, tourSchema);

const { validRows, errors } = validator.validate();
```

**Column Mapping Reuse:**
- Single mapping config: `tour-column-mapping.ts`
- Used by CSV stringify/parse AND ExcelJS column definitions
- Type: `Record<string, { header: string, key: keyof Tour, width?: number }>`

**Alternative (for advanced needs):**
- `zod-csv` - more flexible, but requires custom Excel parsing integration

**Sources:**
- [zod-xlsx GitHub](https://github.com/sidwebworks/zod-xlsx)
- [CSV Validation with Zod](https://dev.to/bartoszgolebiowski/csv-validation-with-zod-h4b)
- [zod-csv GitHub](https://github.com/bartoszgolebiowski/zod-csv)

---

## Recommended Architecture

```
packages/cms/lib/import-export/
├── base-export-service.ts          # Abstract class
├── base-import-service.ts          # Abstract class
├── csv-export-adapter.ts           # Implements base, uses csv-stringify
├── csv-import-adapter.ts           # Implements base, uses csv-parse
├── excel-export-adapter.ts         # Implements base, uses ExcelJS
├── excel-import-adapter.ts         # Implements base, uses ExcelJS + zod-xlsx
├── tour-column-mapping.ts          # Shared config
├── tour-validation-schema.ts       # Existing Zod schema
└── file-type-detector.ts           # Magic bytes detection

apps/web/app/api/tours/
├── export/route.ts                 # GET ?format=csv|xlsx
└── import/route.ts                 # POST (auto-detects format)
```

---

## Key Dependencies

```json
{
  "exceljs": "^4.4.0",
  "zod-xlsx": "^1.2.0",
  "file-type": "^19.7.0"
}
```

---

## Unresolved Questions

1. **Large file handling:** Stream processing for 10K+ tour exports? ExcelJS supports streaming writes.
2. **Excel template support:** Pre-formatted template with formulas for import validation?
3. **Backward compat:** Should old CSV endpoints remain, or redirect to unified endpoint?

---

## Sources

- [Universal Exporter TypeScript](https://dev.to/m4r14/creating-a-universal-exporter-in-typescript-for-csv-json-and-excel-formats-3mil)
- [ExcelJS GitHub](https://github.com/exceljs/exceljs)
- [Mastering ExcelJS](https://habtesoft.medium.com/mastering-exceljs-advanced-excel-operations-in-node-js-0ff859384257)
- [SheetJS vs ExcelJS](https://copyprogramming.com/howto/sheetjs-xlsx-style-need-cell-style-in-excel)
- [NestJS CSV/XLSX Upload](https://dev.to/damir_maham/streamline-file-uploads-in-nestjs-efficient-in-memory-parsing-for-csv-xlsx-without-disk-storage-145g)
- [XLSX MIME Types](https://www.oreateai.com/blog/understanding-xls-mime-types-a-guide-for-developers/14f7e518a1c0f69941df6c76dbc6db9a)
- [zod-xlsx GitHub](https://github.com/sidwebworks/zod-xlsx)
- [CSV Validation with Zod](https://dev.to/bartoszgolebiowski/csv-validation-with-zod-h4b)
