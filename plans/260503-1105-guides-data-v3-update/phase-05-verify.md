# Phase 5: Verify v3 Import + Browser Smoke Test

## Context Links
- Verify script: `scripts/verify-guide-import.ts`
- Mapping JSON: `data/guide-photo-media-mapping.json`
- v3 translated input: `data/translated-guides-v3.json`
- App routes: `apps/web/app/[locale]/guides/page.tsx`, `apps/web/app/[locale]/guides/[slug]/page.tsx`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 0.5h
- **Depends on:** Phase 4

Verify all 15 guides resolve in CMS, photos load, all 3 locales render, accessibility holds.

## Key Insights
- v2 verify script exists; extend with `--v3` mode (or just point at `data/translated-guides-v3.json` + assert all 15 guides in CMS).
- Browser smoke is light-touch: visit `/sv/guides`, `/en/guides`, `/de/guides`, then 3 new detail pages.
- Lighthouse a11y on one new detail page (Anette) for spot quality check.

## Requirements

### Functional
- Extend `scripts/verify-guide-import.ts` with `--v3` flag (or just run with combined v2+v3 inputs):
  - Counts: total guides = 15.
  - Per slug: photo ID is non-null AND ≠ 86 (placeholder) for all 14 + Mats (low-res but real).
  - Per slug: 3 locales populated (sv/en/de).
  - Specializations: ≥ 3 per guide.
  - Bio markdown: contains H3 headings + blockquote (v2-style structure).
- Browser smoke checklist:
  - `/sv/guides` lists all 15 cards.
  - `/en/guides` lists all 15 with translated bio snippet.
  - `/de/guides` lists all 15.
  - `/sv/guides/anette-gustafsson` renders bio + photo.
  - `/sv/guides/leo-eriksson` renders bio + photo + Meänkieli credential visible.
  - `/sv/guides/mats-quist` renders; photo flagged as low-res in report (acceptable).
- Lighthouse a11y ≥ 90 on `/sv/guides/anette-gustafsson`.

### Non-Functional
- Verify script edits stay ≤ 60 added lines.

## Architecture

### Verification Pipeline
```
verify-guide-import.ts --v3
  ├─ Load translated-guides-v3.json (3 entries)
  ├─ Load guide-photo-media-mapping.json
  ├─ Query Payload: all guides (limit: 100)
  ├─ Assert: count = 15
  ├─ For each: 3 locales populated, photo ID resolved + not 86
  └─ Print pass/fail table
```

## Related Code Files

### To Read for Context
- `scripts/verify-guide-import.ts` (existing v2 verifier)
- `apps/web/app/[locale]/guides/page.tsx`
- `apps/web/app/[locale]/guides/[slug]/page.tsx`

### To Modify
- `scripts/verify-guide-import.ts` (add v3 mode if needed)

## Implementation Steps

1. Run verify script: `npx tsx --require ./scripts/patch-next-env.cjs scripts/verify-guide-import.ts --v3`. Address any failures.
2. `npm run dev` (use existing dev server if running).
3. Visit `/sv/guides` — confirm 15 cards, no broken images.
4. Visit `/en/guides` and `/de/guides` — confirm translated content.
5. Visit 3 new detail pages — confirm bio H3 headings, pull quote, photo.
6. Open Mats detail; confirm photo loads (will look low-res — expected; flag in report).
7. Run Lighthouse on `/sv/guides/anette-gustafsson` (Chrome DevTools or `npx unlighthouse`).
8. Capture screenshots: 3 listing pages + 3 detail pages.
9. Write report: `plans/reports/verify-guides-v3-260503.md` listing pass/fail, orphan media IDs, PO follow-ups (Mats photo, Göteborg/Uppsala/Sigtuna cities).

## Todo List

- [ ] Run verify script in v3 mode; resolve failures
- [ ] Browse 3 listing locales on dev
- [ ] Browse 3 new detail pages
- [ ] Confirm Mats low-res photo renders without breaking layout
- [ ] Lighthouse a11y on Anette detail (≥ 90)
- [ ] Write verification report under `plans/reports/`
- [ ] Note PO follow-ups: Mats photo, missing cities (Göteborg/Uppsala/Sigtuna), Mattias second photo

## Success Criteria

- 15 guides in CMS, all locales populated.
- Zero references to placeholder media id 86.
- All listing + detail pages render without errors.
- Lighthouse a11y ≥ 90 on Anette.
- Report filed in `plans/reports/`.

## Risk Assessment

- **Cache stale (Next.js)**: `npm run dev` should reflect immediately; if stale, restart server.
- **Image domain not whitelisted in `next.config.ts`**: existing photos already use Payload media; new uploads share the same domain → no change needed.
- **Mats photo blurry on retina screens**: expected; report flags it for PO.

## Security Considerations

- None new — content-only changes.

## Next Steps

- Update `docs/project-changelog.md` with v3 entry.
- Open follow-up ticket: orphan media cleanup + missing cities.
- Consider PR if changes are committed; otherwise leave for manual review.
