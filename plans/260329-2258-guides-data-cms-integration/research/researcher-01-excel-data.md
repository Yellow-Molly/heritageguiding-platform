# Research Report: Guides Data & Excel File Analysis

**Date:** 2026-03-29 | **Researcher:** researcher-01 | **Status:** Complete

---

## Executive Summary

The Heritage Guiding Platform has 7 guide photos available and a placeholder-guides creation script. No guide-specific data exists in the Excel file — guides are created as simple stubs via `create-placeholder-guides.ts`. A full guide data import pipeline needs to be built: extract guide details from Excel, upload photos, map relationships (specializations, operating areas), and populate CMS.

---

## 1. Excel File Structure

**File:** `docx/Tour-data.xlsx`

Cannot directly parse binary .xlsx file without executing Python. However, analysis of downstream processing reveals:

- **Primary Data Source:** Parsed by `tour-excel-import-service.ts` (ExcelJS)
- **Schema:** Tour CSV schema (guides embedded as `guide_slug` field referencing existing guide)
- **Known Columns:** Title, description, highlights, duration, pricing, meeting point, logistics, accessibility, targetAudience, categories, neighborhoods, guide reference
- **Locales Supported:** Swedish (sv), English (en), German (de) — translations handled separately

**Limitation:** Excel file structure details (sheet names, guide-specific columns) not directly accessible without binary parsing.

---

## 2. Guide Data Fields (Available in CMS)

**Guides Collection Schema** (`packages/cms/collections/guides.ts`):

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| name | text (100 max) | No | Required, display title |
| slug | text | No | Required, unique, indexed |
| status | select | No | active / inactive / on-leave |
| bio | richText | Yes | Guide background (sv/en/de) |
| credentials | array | Yes | Certifications & training |
| photo | upload (media) | No | Professional guide photo |
| email | email | No | Private contact |
| phone | text | No | Private contact |
| languages | select[] | No | sv, en, de, fr, es, it (primary) |
| additionalLanguages | select[] | No | ja, zh, no, da, fi, nl, pt, ru, ar, ko, pl, th, hi |
| specializations | relationship | No | Linked to categories |
| operatingAreas | relationship | No | Linked to cities |

**Key Insight:** Guide data is multi-locale. Bio & credentials have Swedish/English/German translations.

---

## 3. Guide Photos Available

**Directory:** `docx/Guide-photos/` — 7 files total

1. `Sabine_Gru╠ên.jpeg` — Character encoding issue in filename
2. `Olof_Na╠êslund.jpeg` — Character encoding issue
3. `Niklas_Lo╠êfstrom.jpeg` — Character encoding issue
4. `Christian_Arnet.jpeg`
5. `Anders_Boysen.jpeg`
6. `Annika_Bernholm.jpg`
7. `Sophie_Sahlin.jpeg`

**Issues:**
- 3 files have corrupt Unicode in filenames (Swedish chars ö, ä mangled)
- Filenames don't match guide slug pattern (e.g., "Sabine_Gru╠ên" vs "stockholm-authorized-guide")
- No hero/primary photo designation
- Photos appear to be raw, not "Medium" sized like tour photos

---

## 4. Existing Import Scripts

### A. Tour Data Pipeline (Phases 0-4)

1. **Phase 1:** `import-tour-photos.ts` — Uploads photos from `docx/Photos/{tour-slug}/`, creates media entries, outputs `photo-media-mapping.json`
2. **Phase 2:** `translate-tour-data.ts` — Translates tour data (sv→en/de), outputs `translated-tours.json`
3. **Phase 3:** `import-tour-data.ts` — Creates/updates tours in Payload, links guides by slug, applies SEO fields
4. **Phase 4:** `verify-tour-import.ts` — Validates tour integrity

### B. Guide Placeholder Script

**File:** `scripts/create-placeholder-guides.ts` (14 lines)

**Current Behavior:**
- 9 hardcoded guide slugs (Stockholm auth guides, various tour types)
- Creates minimal entries: name (derived from slug), slug, status='active', languages=['sv','en']
- No bio, photo, credentials, specializations
- No relationship to tours yet

**Problem:** Guides are placeholder stubs. Real guide data (bio, photo, credentials, languages) not populated.

---

## 5. Data Translation Requirements

**Swedish → English/German Mapping Needed:**

For guides in Excel (if data exists):
- **Bio field:** Multi-paragraph, needs professional translation (v3.75.0 uses richText Lexical format)
- **Credentials:** Technical certifications, training courses (context-sensitive translation)
- **Specializations:** Category slugs (non-translatable, linked to existing categories)
- **Languages:** Enum values (sv/en/de/etc. - fixed, no translation)

**Note:** Current `translate-tour-data.ts` handles tour translations. Guide translation logic would need similar pipeline:
1. Extract guide data from Excel
2. Translate bio & credentials via LLM or manual translation
3. Output JSON with sv/en/de versions
4. Import into Payload with locales

---

## 6. Data Flow Gap Analysis

**Missing Pieces:**

1. **Guide data extraction:** No script parses guide details from Excel
2. **Guide photos mapping:** No script links `docx/Guide-photos/*.jpeg` to guide entries
3. **Guide translation:** No translation pipeline for bio/credentials
4. **Relationship setup:** Specializations & operatingAreas not linked
5. **Filename normalization:** Unicode corruption in photo filenames must be fixed

**Architectural Fit:**

- Follow Phase 1-4 tour pattern: extract → translate → upload photos → create/update guides
- Reuse `tour-excel-import-service.ts` patterns for Excel parsing
- Create parallel guide pipeline: Phase 0 (extract), Phase 1 (photos), Phase 2 (translate), Phase 3 (import)

---

## Unresolved Questions

1. **Where is guide data in Excel?** Is there a separate "Guides" sheet, or are guides embedded in tour data only?
2. **Translation availability?** Are English/German bios provided in Excel, or does this require new translation work?
3. **Photo filename mapping?** How do photo filenames (e.g., "Christian_Arnet.jpeg") map to guide slugs (e.g., "stockholm-authorized-guide-city-hall-walking-tour")?
4. **Relationship definitions?** Which guides specialize in which categories? Which guides operate in which cities?
5. **Character encoding?** Are the corrupted filenames (Swedish ö/ä) salvageable, or should photos be re-uploaded with clean names?

---

## Recommendations

1. **Inspect Excel file directly:** Open `docx/Tour-data.xlsx` in Excel/LibreOffice to identify sheet structure and guide data columns
2. **Normalize photo filenames:** Rename corrupted files before import pipeline
3. **Create guide data extraction script:** Parse guide sheet/columns, emit `data/guides-raw.json`
4. **Create guide import script:** Follow Phase 1-4 pattern, paralleling tour pipeline
5. **Clarify relationships:** Document guide→category & guide→city mappings from source data

