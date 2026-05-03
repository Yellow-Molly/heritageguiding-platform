---
title: "Guides Data V3 Update — 3 New Guides + Photo Web-Optimization"
description: "Add 3 new guides (Anette Gustafsson, Leo Eriksson, Mats Quist), convert oversized photos to web standard, refresh photos for guides whose files changed since v2 import."
status: completed
priority: P1
effort: 3h
branch: master
tags: [guides, data-import, translation, docx, cms, photos, optimization]
created: 2026-05-03
completed: 2026-05-03
blockedBy: []
blocks: []
report: plans/reports/verify-guides-v3-260503.md
---

# Guides Data V3 Update

## Context

`docx/Guides data v3/` contains 15 Swedish profile docx files. Hash-compare against `docx/Guides data v2/` confirms:

- **12 v2 docx = byte-identical in v3** → already imported in CMS, no re-import.
- **3 NEW guides**: Anette Gustafsson, Leo Eriksson, Mats Quist (same section structure as v2: `Om`, `Specialisering`, `Guidestil`, `Vad gästerna uppskattar`, `Det som gör… unika`).

`docx/Guide-photos/` has 16 photos. Several are oversized for web (3-4MB / 5712px tall). User wants conversion to web standard before upload.

CMS state after v2 import: 9 guides have real photos (media IDs 78–85, 87); **asa-ovrelid, svante-bergqvist, tommy-nilsson** still link to placeholder media 86.

## Photo Inventory (current `docx/Guide-photos/`)

| File | Dimensions | Size | Action |
|------|------------|------|--------|
| Leo Eriksson.JPG | 3213×5712 | 3.1MB | **Convert** + upload (NEW) |
| Svante Bergqvist.jpeg | 4284×5712 | 3.6MB | **Convert** + replace placeholder |
| Tommy Nilsson.jpg | 1987×2838 | 712KB | Convert + replace placeholder |
| Jack Voldstad.jpg | 2016×1512 | 629KB | Convert + replace (file refreshed) |
| Sophie Sahlin.jpeg | 1823×2076 | 571KB | Convert + replace (file refreshed) |
| Asa_Ovrelid.jpg | 2000×2000 | 207KB | Convert (≥1600px) + replace placeholder |
| Anders Boysen.jpeg | 1536×2048 | 432KB | Convert (≥1600px) + replace (file refreshed) |
| Annika Bernholm.jpg | 2048×2048 | 300KB | Convert (≥1600px) + replace (file refreshed) |
| Anette Gustafsson.JPG | 2045×1636 | 260KB | Convert (≥1600px) + upload (NEW) |
| Mats Quist.jpeg | 430×640 | 25KB | Use as-is (low-res, **flag in report**) |
| Mattias Wallin 1.jpeg | 1200×1600 | 124KB | **Ignore** (extra companion) |
| Mattias_Wallin.jpeg | 1200×1600 | 134KB | Keep (already imported) |
| Christian, Niklas, Olof, Sabine | ≤1600px, <150KB | — | Keep as-is |

Standard: max 1600px longest side, JPEG quality 85, target 200–400KB.

## Re-Upload Targets (per user decision: refresh all photos changed since v2 import)

| Slug | Reason | Current CMS media | New file |
|------|--------|-------------------|----------|
| anette-gustafsson | NEW | — | `Anette Gustafsson.JPG` (converted) |
| leo-eriksson | NEW | — | `Leo Eriksson.JPG` (converted, was 3.1MB) |
| mats-quist | NEW | — | `Mats Quist.jpeg` (as-is, low-res flag) |
| asa-ovrelid | placeholder→real | 86 | `Asa_Ovrelid.jpg` (converted) |
| svante-bergqvist | placeholder→real | 86 | `Svante Bergqvist.jpeg` (converted, was 3.6MB) |
| tommy-nilsson | placeholder→real | 86 | `Tommy Nilsson.jpg` (converted) |
| jack-voldstad | file refreshed | 87 | `Jack Voldstad.jpg` (converted) |
| sophie-sahlin | file refreshed | 84 | `Sophie_Sahlin.jpeg` (converted) |
| anders-boysen | file refreshed | 78 | `Anders_Boysen.jpeg` (converted) |
| annika-bernholm | file refreshed | 79 | `Annika_Bernholm.jpg` (converted) |

Total: 10 photos (3 new uploads + 3 placeholder replacements + 4 refreshes).

## Phases

| # | Phase | File | Status | Effort | Depends On |
|---|-------|------|--------|--------|------------|
| 1 | Convert photos to web standard | [phase-01](phase-01-convert-photos.md) | ✅ Complete | 0.5h | — |
| 2 | Parse + translate 3 new guides | [phase-02](phase-02-parse-translate.md) | ✅ Complete | 1h | — |
| 3 | Upload photos + update mapping | [phase-03](phase-03-upload-photos.md) | ✅ Complete | 0.5h | Phase 1 |
| 4 | Import 3 new guides + photo refresh | [phase-04](phase-04-import.md) | ✅ Complete | 0.5h | Phases 2 + 3 |
| 5 | Verify + browser smoke | [phase-05](phase-05-verify.md) | ✅ Complete | 0.5h | Phase 4 |

Phases 1 and 2 ran in parallel.

## Outcome (2026-05-03)

✅ **15 guides live in CMS** (12 v2 + 3 new). 0 import errors. 0 placeholder media leftover.
✅ **10 photos uploaded** (ids 88–97) — Leo 3.1MB→148KB, Svante 3.6MB→260KB, others avg 200KB.
✅ **7 photo refreshes applied** — all placeholder users (asa/svante/tommy) now have real photos.
⚠ **Pre-existing follow-ups surfaced** in verification report:
- Anders Boysen: 0 credentials (v2 data gap, not v3 regression)
- All 15 guides: specializations=0 (keyword resolver gap from v2)
- Anette Göteborg: city missing in CMS, defaulted to Stockholm

See `plans/reports/verify-guides-v3-260503.md` for full details + PO action items.

## Key Decisions (confirmed in validation)

- **Web photo standard**: 1600px max longest side, JPEG quality 85, target 200–400KB.
- **Mats Quist photo**: upload as-is despite 430×640 / 25KB; flag low-res in verification report.
- **Existing-guide photo policy**: re-upload all photos with file mtime > v2 import (Apr 14). 4 refreshes + 3 placeholder replacements.
- **Mattias Wallin 1.jpeg**: ignore (no schema slot for second photo; PO can request gallery feature later).
- **DOCX content for 12 existing guides**: byte-identical → skip bio re-import. Photo refresh only.
- **Translation author**: Claude in-session (no Anthropic API). 3 new × 2 locales = 6 translation blocks, mirrors v2 approach.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sharp/PIL conversion produces visible quality loss | Low | Spot-check 2 converted images before bulk; keep originals untouched. |
| Photo replacement orphans old media records in CMS | Low | Keep old media IDs (don't delete) — Payload will dereference; cleanup is a separate maintenance task. |
| Mats Quist 25KB photo looks bad on detail page | Medium | Flag in report; PO can swap later via admin without code changes. |
| Slug rule mismatch for Anette/Leo/Mats | Low | Mirror v2 transliteration rule; validated by parser unit echo before import. |
| Import script chokes on partial v3 input (only 3 guides) | Medium | Run with `--update --status=active`; v2 script already supports incremental input. |

## Rollback

- `docx/Guide-photos/` originals untouched (conversion writes to `docx/Guide-photos-web/`).
- Old CMS media records preserved; mapping JSON edits are git-tracked.
- `data/guides-v3-sv.json` and `data/translated-guides-v3.json` are additive new files; v2 inputs untouched.
- Payload version history captures the import.

## Cross-Plan Dependencies

Scanned `plans/`:
- `260414-2310-guides-data-v2-update` — **completed**. Direct predecessor; this plan layers on top.
- `260418-1438-guide-profile-redesign` — UI only, independent.
- `260412-1736-guide-details-redesign` — UI only, independent.

No `blockedBy` / `blocks` links.

## Verification

1. `node scripts/convert-guide-photos.cjs --dry-run` lists 10 conversions with target dims/sizes.
2. `npx tsx --require ./scripts/patch-next-env.cjs scripts/import-guide-data.ts --input=data/translated-guides-v3.json --dry-run` shows 3 new guides created, 0 errors.
3. Live import: 3 new guides + 7 photo refreshes; CMS admin shows 15 total guides.
4. `npx tsx scripts/verify-guide-import.ts --v3` confirms 15 guides, 3 locales each, all photo IDs resolved (no placeholder for asa/svante/tommy).
5. `npm run dev` → `/sv/guides`, `/en/guides`, `/de/guides` render all 15 cards. Detail pages for 3 new guides show translated bio + photo.
6. Lighthouse a11y ≥ 90 on one new detail page.

## Open Questions

- Should orphaned old media records (replaced placeholders, refreshed photos) be deleted or kept for audit? Default: keep, log IDs in report.
