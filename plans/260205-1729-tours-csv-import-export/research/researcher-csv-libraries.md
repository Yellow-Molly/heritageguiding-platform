# CSV Libraries Research Report
**Date:** 2026-02-05
**Project:** HeritageGuiding Platform - Tours CSV Import/Export
**Context:** Evaluating Node.js/TypeScript CSV libraries for bulk tour data operations

---

## Executive Summary

**Recommendation: Use `csv-parse` + `csv-stringify` (node-csv package)**

Best balance of streaming, performance, Unicode support, and production reliability for CSV import/export in tours management. Alternative: PapaParse for lightweight client-side fallbacks.

---

## Library Comparison

| Feature | csv-parse + csv-stringify | fast-csv | PapaParse | csv-parser |
|---------|--------------------------|----------|-----------|------------|
| **Streaming** | Native Transform streams | Stream-first design | Step callback | Native streams |
| **Non-quoted CSV** | 9.5s (140MB) | Slowest | Fastest (2x faster) | ~10s |
| **Quoted CSV** | 10.3s (140MB) | Slowest | Fastest (but 2x slower than unquoted) | ~10s |
| **Bundle Size** | ~25-30KB | ~35-40KB | ~30-35KB | 1.5KB |
| **TypeScript** | Partial types | Built with TS | TS support | JS with types |
| **Memory Footprint** | Low (streaming) | Very low (stream-first) | Low (streaming) | Very low |
| **Maturity** | Stable/production | Production-tested | Stable | Lightweight |
| **Unicode/UTF-8** | Native (encoding option) | Native UTF-8 | Native UTF-8 | Native UTF-8 |
| **Special Chars** | Excellent (Swedish/German) | Good | Good | Good |
| **Weekly Downloads** | ~500K | ~640K | ~300K | ~2M |

---

## Detailed Analysis

### 1. csv-parse + csv-stringify (RECOMMENDED)

**Package:** `node-csv` (includes both modules)
**NPM:** https://www.npmjs.com/package/csv-parse

**Strengths:**
- Native Node.js Transform Stream API integration
- Streaming + callback-based APIs for flexibility
- Encoding detection via BOM (UTF-8, UTF-16LE auto-detected)
- Explicit `encoding` option for non-standard encodings
- Battle-tested in production systems
- Separate modules allow optional imports

**Performance:** 9.5-10.3 seconds on 140MB files

**Unicode Handling:**
```javascript
// Auto-detect UTF-8/UTF-16LE via BOM
const parser = parse({ encoding: 'utf8' });

// For CSV files with special chars (å, ä, ö, ü, ß)
// UTF-8 is default and handles Nordic/Germanic chars automatically
// No iconv needed for standard UTF-8 files
```

**Code Example - Parse (streaming):**
```typescript
import { parse } from 'csv-parse';
import * as fs from 'fs';

const records: Record<string, any>[] = [];

fs.createReadStream('tours.csv')
  .pipe(parse({ columns: true, encoding: 'utf8' }))
  .on('data', (record) => {
    records.push(record); // Row-by-row processing
  })
  .on('error', (error) => {
    console.error('Parse error:', error);
  })
  .on('end', () => {
    console.log('Parsing complete:', records.length);
  });
```

**Code Example - Stringify (generation):**
```typescript
import { stringify } from 'csv-stringify';
import * as fs from 'fs';

const tours = [
  { id: '1', title: 'Medieval Stockholm', price: '89' },
  { id: '2', title: 'Uppsala Universitet Tur', price: '45' }
];

const output = fs.createWriteStream('tours-export.csv');

stringify(tours, {
  header: true,
  encoding: 'utf8',
  quote_char: '"',
  escape_char: '"'
})
  .pipe(output)
  .on('finish', () => console.log('Export complete'))
  .on('error', (error) => console.error('Stringify error:', error));
```

**Edge Cases Handled:**
- Quoted fields with embedded commas: `"Stockholm, Sweden"`
- Newlines in quoted cells: `"Multi\nline\ntext"`
- Escaped quotes: `"He said ""Hello"""`
- BOM detection for UTF-16LE files
- Custom delimiters (semicolon, tab)

---

### 2. fast-csv

**Package:** `fast-csv`
**NPM:** https://www.npmjs.com/package/fast-csv

**Strengths:**
- Pure TypeScript codebase (first-class TS support)
- Stream-first architecture (minimal memory)
- Combines parse + format in one package
- Production battle-tested (millions of records daily)
- Comprehensive API for complex transformations

**Weaknesses:**
- Slower than alternatives on benchmark tests
- Larger bundle compared to csv-parser
- Overkill for simple import/export

**Use Case:** Complex CSV transformations with validation/enrichment during parsing.

---

### 3. PapaParse

**Package:** `papaparse`
**NPM:** https://www.npmjs.com/package/papaparse

**Strengths:**
- Fastest parser in benchmarks (2x faster than node-csv)
- Works in browser AND Node.js
- Step callback for true streaming behavior
- Handles malformed CSV gracefully

**Weaknesses:**
- Primarily browser-optimized (not ideal for server)
- Less mature server-side use patterns
- Not specialized for server streaming

**Use Case:** Client-side preview/validation before upload, browser-based export.

---

### 4. csv-parser

**Package:** `csv-parser`
**NPM:** https://www.npmjs.com/package/csv-parser

**Strengths:**
- Ultra-lightweight (1.5KB gzipped)
- Simple, focused API
- Good for minimal footprint requirements

**Weaknesses:**
- Read-only (no built-in CSV generation)
- Less feature-rich
- No encoding options

**Use Case:** Simple, lightweight parsing without generation needs.

---

## Encoding & Special Characters

### UTF-8 with Nordic/Germanic Characters

All modern Node.js CSV libraries handle UTF-8 natively:

```typescript
// These work automatically in UTF-8:
const data = [
  { name: 'Stockholm', description: 'Björkö Ö' },    // Swedish å, ä, ö
  { name: 'München', description: 'Über Größe' }     // German ü, ä, ö, ß
];
```

### Handling Excel-Generated CSVs

**Critical Issue:** Microsoft Excel saves CSVs in ISO-8859-1 (Windows) or Macintosh encoding, not UTF-8.

**Solution for Excel files:**
```typescript
import { parse } from 'csv-parse';
import iconv from 'iconv-lite';

// For Excel CSV files that may not be UTF-8
fs.createReadStream('excel-export.csv')
  .pipe(iconv.decodeStream('iso-8859-1')) // Convert to UTF-8
  .pipe(parse({ columns: true }))
  .on('data', (record) => {
    // Now contains proper UTF-8 decoded text
  });
```

### BOM (Byte Order Mark) Detection

csv-parse automatically detects UTF-8 and UTF-16LE via BOM:
- UTF-8 BOM: `EF BB BF`
- UTF-16LE BOM: `FF FE`
- No BOM: Assumes UTF-8 (standard for web/Node.js)

---

## Error Handling Patterns

```typescript
// Validation + error recovery
import { parse } from 'csv-parse';

const records: Tour[] = [];
const errors: { row: number; error: string }[] = [];

fs.createReadStream('tours.csv')
  .pipe(parse({ columns: true, encoding: 'utf8' }))
  .on('data', (record, context) => {
    try {
      // Validate schema
      const tour = tourSchema.parse(record);
      records.push(tour);
    } catch (error) {
      errors.push({
        row: context.lines,
        error: error.message
      });
    }
  })
  .on('error', (error) => {
    // Handle stream errors (file not found, permission denied, etc)
    console.error('Stream error:', error);
  })
  .on('end', () => {
    console.log(`Processed: ${records.length}, Errors: ${errors.length}`);
    if (errors.length > 0) {
      // Return partial results + error report
    }
  });
```

---

## Performance Recommendations

1. **Large Files (>50MB):** Use streaming API (not buffering entire file)
   ```typescript
   // GOOD: Streaming row-by-row
   fs.createReadStream(path).pipe(parse({ columns: true }));

   // BAD: Loading entire file into memory
   const content = fs.readFileSync(path, 'utf8');
   const data = parse(content);
   ```

2. **Memory-Critical:** Use `fast-csv` for minimal footprint
3. **Speed Priority:** Use `PapaParse` for client-side previews
4. **Production Default:** Use `csv-parse` + `csv-stringify`

---

## Bundle Size Impact

For Next.js 15 app (tours CSV import/export feature):

```
csv-parse + csv-stringify:  ~35KB (gzipped ~10KB)
fast-csv:                   ~40KB (gzipped ~12KB)
papaparse:                  ~35KB (gzipped ~8KB)
csv-parser (parse-only):    ~5KB (gzipped ~1.5KB)
```

Impact negligible for app size; performance difference from features more important.

---

## Recommended Setup

```json
{
  "dependencies": {
    "csv-parse": "^5.5.x",
    "csv-stringify": "^6.4.x"
  },
  "devDependencies": {
    "@types/node": "^20.x"
  }
}
```

**Why separate packages?**
- Tree-shaking: Import only what you need
- Flexibility: Use only parse for import, only stringify for export
- Smaller bundle: Don't load unused code

---

## Implementation Checklist

- [ ] Add `csv-parse` + `csv-stringify` to `apps/web/package.json`
- [ ] Create API route: `/api/tours/import` (POST file)
- [ ] Create API route: `/api/tours/export` (GET CSV download)
- [ ] Add input validation (Zod schema for CSV columns)
- [ ] Add error reporting (row-level errors with line numbers)
- [ ] Test with UTF-8 Swedish/German characters
- [ ] Test with Excel-exported CSVs (handle encoding)
- [ ] Add file size limits (e.g., 50MB max)
- [ ] Add rate limiting to import endpoints
- [ ] Document supported columns + required fields

---

## Sources

- [csv-parse NPM](https://www.npmjs.com/package/csv-parse)
- [CSV Parse Stream API](https://csv.js.org/parse/api/stream/)
- [CSV Stringify NPM](https://www.npmjs.com/package/csv-stringify)
- [fast-csv NPM](https://www.npmjs.com/package/fast-csv)
- [PapaParse Official](https://www.papaparse.com/)
- [LeanyLabs CSV Parser Benchmarks](https://leanylabs.com/blog/js-csv-parsers-benchmarks/)
- [CSV Encoding in Node.js](https://blog.theodo.com/2017/04/csv-escape-from-the-encoding-hell-in-nodejs/)
- [CSV Parse Encoding Options](https://csv.js.org/parse/options/encoding/)

---

## Unresolved Questions

None at this time. Research covers primary evaluation criteria and implementation guidance.
