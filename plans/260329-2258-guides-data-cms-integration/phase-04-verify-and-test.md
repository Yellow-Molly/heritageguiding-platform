# Phase 4: Verify and Test

## Context Links
- Pattern reference: `scripts/verify-tour-import.ts`
- Guide listing page: `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx`
- Guide detail page: `apps/web/app/(site)/[locale]/(frontend)/guides/[slug]/page.tsx`
- Guide API: `apps/web/lib/api/get-guides.ts`, `apps/web/lib/api/get-guide-by-slug.ts`
- Tour guide card: `apps/web/components/tour/guide-card.tsx`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 0.5h
- **Depends on:** Phase 3

Automated verification script + manual browser testing to confirm all guide data renders correctly.

## Key Insights
- Frontend pages are already built and functional with placeholder data
- Need to verify: data integrity in CMS, API responses, frontend rendering in all 3 locales
- Existing `verify-tour-import.ts` pattern checks collection counts, localized fields, relationships

## Requirements

### Functional
- Verify all 7 guides exist with correct fields in all 3 locales
- Verify each guide has: name, slug, bio (sv/en/de), credentials (sv/en/de), photo, languages
- Verify tour->guide relationships: each tour points to a valid guide
- Verify no orphaned placeholder guides remain
- Run existing test suite to check for regressions

### Non-Functional
- Script exit code 0 if all checks pass, 1 if issues found
- Clear console output with per-guide status

## Architecture

### Verification Checks
```
1. Collection counts: guides=7, no placeholders
2. Per-guide checks (all 3 locales):
   - name exists
   - bio.{sv,en,de} has Lexical content (root.children.length > 0)
   - credentials.{sv,en,de} has items
   - photo is valid media reference
   - languages array is non-empty
   - specializations resolved (not null IDs)
3. Tour relationship checks:
   - Every tour has a guide reference
   - Every guide reference resolves to a real guide (not placeholder)
   - Guide-to-tour mapping matches expected config
4. No orphaned placeholders:
   - No guide with slug matching 'stockholm-authorized-guide*'
```

## Related Code Files

### Files to Create
- `scripts/verify-guide-import.ts` — verification script

### Files to Read (patterns)
- `scripts/verify-tour-import.ts` — verification pattern

### Existing Tests to Run
- `npm test` — full test suite (1009 tests)

## Implementation Steps

1. Create `scripts/verify-guide-import.ts` following `verify-tour-import.ts` pattern
2. Implement checks:
   a. Fetch all guides with `locale: 'all'`, depth 1
   b. Check count = 7
   c. For each guide: verify name, slug, bio (3 locales), credentials (3 locales), photo, languages
   d. Fetch all tours with depth 1, verify each tour.guide resolves
   e. Check no placeholder slugs remain
3. Print summary with issue count
4. Manual testing checklist:
   - Browse `/sv/guides` — all 7 guides listed with photos
   - Browse `/en/guides` — English bios displayed
   - Browse `/de/guides` — German bios displayed
   - Click each guide -> detail page loads with bio, credentials, photo, tours section
   - Browse tour detail pages -> guide card shows real guide name + photo
5. Run `npm test` to verify no regressions

## Todo List
- [ ] Create verify-guide-import.ts
- [ ] Run verification script
- [ ] Fix any issues found
- [ ] Manual browser test: guide listing (sv/en/de)
- [ ] Manual browser test: guide detail pages (sv/en/de)
- [ ] Manual browser test: tour detail guide cards
- [ ] Run full test suite (`npm test`)

## Success Criteria
- Verification script exits with code 0
- All 7 guides render on listing page in all 3 locales
- Guide detail pages show translated bio, credentials, photo
- Tour detail pages show correct guide card with real photo/name
- Existing test suite passes (1009 tests)
- No console errors in browser

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Frontend expects fields that don't exist on new guides | Low | Medium | Frontend already works with placeholder data; real data has more fields, not fewer |
| Photo URLs broken on frontend | Low | Medium | Verify photo media entry has valid URL in CMS admin |
| Rich text (Lexical) rendering issues | Low | Medium | Bio uses same Lexical format as tour descriptions (already working) |

## Security Considerations
- Verify email/phone not exposed on public-facing pages
- Verify guide API responses don't leak admin-only fields

## Next Steps
- If all checks pass: mark plan as completed
- If issues found: fix and re-run relevant phase
- Consider publishing guides to `status: published` after verification (currently `active` but tours may need `published` status)
