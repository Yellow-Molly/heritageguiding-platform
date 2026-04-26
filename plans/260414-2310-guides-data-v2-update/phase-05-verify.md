# Phase 5: Verify + Browser Smoke

## Context Links
- Existing verifier: `scripts/verify-guide-import.ts`
- CMS admin: `http://localhost:3000/admin`
- Public routes: `/sv/guides`, `/en/guides`, `/de/guides` + detail pages
- Phase 4 output: 11 guides in CMS

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 0.5h
- **Depends on:** Phase 4

## Key Insights
- v1 verifier likely asserts 7 guides; must extend to accept 11 and flag placeholder photos.
- Lighthouse a11y already baselined in earlier WCAG phase — expect ≥ 90 on guide detail.

## Requirements

### Functional
- `--v2` flag on `verify-guide-import.ts`:
  - Asserts 11 guide slugs present (exact set)
  - For each guide, asserts SV/EN/DE bios non-empty and contain the 4 H3 markers (`### `)
  - Asserts photo media ID set for all 11 (log which are on `_placeholder`)
  - Asserts `operatingAreas` non-empty for all 11
  - Asserts `credentials` non-empty for all 11 (sv locale)
- Browser smoke (manual but scripted in checklist):
  - `npm run dev`; visit each of 3 guide-listing locales; count cards = 11
  - Click one existing (Sabine) + one new (Tommy); detail page renders bio with visible H3 sections and pull quote
- Optional: `lighthouse` run on `/en/guides/sabine-gruen` to confirm a11y ≥ 90 (existing script from Phase 11)

### Non-Functional
- Edit existing `verify-guide-import.ts` in place.

## Implementation Steps
1. Add `--v2` flag parsing.
2. Define `EXPECTED_V2_SLUGS` constant (11 slugs).
3. Extend report function: per-guide rows with columns `slug | sv-bio | en-bio | de-bio | h3-count | photo | creds | areas`.
4. Print summary: `11/11 present, 4 placeholder photos, 0 missing credentials, 0 missing areas`.
5. Add final manual-step output block listing browser URLs to visit.

## Todo List
- [ ] Edit `scripts/verify-guide-import.ts` — add `--v2` path
- [ ] Run: `npx tsx scripts/verify-guide-import.ts --v2` → expect 0 errors
- [ ] `npm run dev` and visit `/sv/guides`, `/en/guides`, `/de/guides` — confirm 11 cards each
- [ ] Click into Sabine (updated) + Tommy (new) detail pages in all 3 locales — confirm bio structure
- [ ] (Optional) Lighthouse a11y ≥ 90 on one detail page
- [ ] Write journal entry via `/ck:journal`

## Success Criteria
- Verify script exits 0 with `11/11 present` summary
- Listing pages show 11 cards in all 3 locales
- Detail pages show: bio paragraphs, 4 H3 sections, blockquote pull quote, photo (or placeholder)
- No console errors in browser DevTools on guide pages
- Lighthouse a11y ≥ 90 (if measured)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `markdownToLexical()` strips H3/blockquote formatting | Medium | Medium | Phase 4 dry-run catches; if broken, fall back to plain paragraphs + visual separators |
| Guide card component doesn't render new guides (missing photo) | Low | Medium | Placeholder media ID ensures non-null photo; component should render normally |
| Lighthouse regression from added bio content | Low | Low | Short content; no additional images; measured baseline unchanged |

## Next Steps
- Journal entry via `/ck:journal` capturing the in-session-translation approach as a reusable pattern
- Commit: `feat(guides): import v2 guide data with in-session translations`
