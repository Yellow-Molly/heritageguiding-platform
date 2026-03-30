# Tour Detail Page Improvements

**Status:** Complete
**Priority:** High
**Created:** 2026-03-30
**Branch:** `feat/tour-detail-improvements`

## Overview

Fix 5 issues on the tour detail page (`/tours/[slug]`):

1. Add Header + Footer (missing, unlike all other frontend pages)
2. Remove breadcrumb navigation
3. Fix title accessibility (white-on-image fails WCAG contrast)
4. Upgrade gallery to fullscreen lightbox
5. Replace "You May Also Like" mock data with real Payload CMS query

## Phases

| # | Phase | Status | Files |
|---|-------|--------|-------|
| 1 | [Header/Footer + Remove Breadcrumb](phase-01-header-footer-breadcrumb.md) | DONE | 1 file |
| 2 | [Title Accessibility Fix](phase-02-title-accessibility.md) | DONE | 1 file |
| 3 | [Fullscreen Gallery](phase-03-fullscreen-gallery.md) | DONE | 2 files |
| 4 | [Related Tours Real Data](phase-04-related-tours-real-data.md) | DONE | 1 file |

## Validation Summary

**Validated:** 2026-03-30
**Questions asked:** 4

### Confirmed Decisions
- **Header variant:** Transparent (default) — overlays hero image, matches homepage pattern
- **Gallery navigation:** Thumbnail strip at bottom (not dots)
- **Gallery trigger:** Thumbnail strip below hero (not button in corner) — most discoverable
- **Caching strategy:** Extract category slugs to `string[]` before passing to `unstable_cache` — ensures serializable args

### Action Items
- [ ] Phase 1: Use `<Header />` without variant (transparent default)
- [ ] Phase 3: Gallery button replaced with thumbnail preview strip below hero image
- [ ] Phase 3: Fullscreen gallery uses thumbnail strip navigation
- [ ] Phase 4: Refactor cached function signature to `(tourId: string, slugs: string[], limit: number)`

## Dependencies

- Payload CMS must have published tours (already have tour data imported)
- No cross-plan dependencies detected

## Success Criteria

- Header/Footer visible on tour detail page
- No breadcrumb rendered
- Title contrast ratio >= 4.5:1 (WCAG AA)
- Gallery opens fullscreen with smooth navigation
- Related tours fetched from Payload CMS, not mock data
