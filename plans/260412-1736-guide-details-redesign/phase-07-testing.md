# Phase 07 — Testing + Accessibility Verification

## Context
- All prior phases (1–6) must be complete
- [Existing test suite](../../apps/web/__tests__/) — 1009 unit tests, 90%+ coverage
- WCAG AA compliance requirement

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 1.5h
- **Blocked by:** Phases 2, 3, 4, 5 (all UI changes must be in place)

Write unit tests for new/modified components, verify accessibility, run full test suite.

## Key Insights
- Existing test pattern: Vitest + React Testing Library, `describe`/`it` blocks
- Server components tested via `render()` with mocked `getTranslations`
- Client components (`guide-sticky-cta.tsx`) tested with `@testing-library/user-event`
- Credential icon mapping is a pure function — easy to unit test

## Requirements

**Functional:**
- Unit tests for: `getCredentialIcon`, `GuideDetailSidebar`, `GuideDetailBio`, `GuideStickyCta`, updated `GuideToursSection`
- Snapshot or structural assertions (not pixel-perfect)
- Accessibility: all images have alt text, headings in order, CTA has accessible label, color contrast

**Non-functional:**
- Maintain 90%+ coverage
- All 1009+ existing tests still pass
- No `test.skip` or `test.todo` left behind

## Test Matrix

| Component | Test Type | What to Verify |
|-----------|-----------|----------------|
| `getCredentialIcon` | Unit | Keyword matching, fallback icon, case insensitivity |
| `GuideDetailSidebar` | Unit | Renders name, avatar, languages, areas, credentials, specializations, CTA (desktop) |
| `GuideDetailSidebar` | Unit | Handles missing optional data (no photo, no credentials, no yearsExperience) |
| `GuideDetailBio` | Unit | Renders heading with name, renders RichText, handles null bio |
| `GuideToursSection` | Unit | 2-col grid class present, inline price (no overlay), meta row with duration+rating |
| `GuideToursSection` | Unit | Empty state message |
| `GuideStickyCta` | Unit | Renders button when tourCount > 0, returns null when 0 |
| `GuideStickyCta` | Unit | Click triggers scrollIntoView |
| `page.tsx` (integration) | Integration | Split-panel layout renders, breadcrumb in both positions |
| Accessibility | Manual/automated | Heading hierarchy, alt text, touch targets, color contrast |

## Related Code Files
| Action | File |
|--------|------|
| Create | `apps/web/__tests__/lib/get-credential-icon.test.ts` |
| Create | `apps/web/__tests__/components/guide/guide-detail-sidebar.test.tsx` |
| Create | `apps/web/__tests__/components/guide/guide-detail-bio.test.tsx` |
| Create | `apps/web/__tests__/components/guide/guide-sticky-cta.test.tsx` |
| Modify | `apps/web/__tests__/components/guide/guide-tours-section.test.tsx` (update expectations) |

## Implementation Steps

1. **`getCredentialIcon` tests:**
   - Matches "Certified Stockholm Guide" → BadgeCheck
   - Matches "Master's Degree in History" → GraduationCap
   - Matches "First Aid Certified" → HeartPulse (first-aid match, not "certified")
   - Unmatched "Some Random Credential" → Award fallback
   - Case insensitivity: "CERTIFIED" works

2. **`GuideDetailSidebar` tests:**
   - Mock `getTranslations` to return key as value
   - Provide full `GuideDetail` fixture with all fields
   - Assert: name rendered as h1, avatar image present, language pills rendered, area pills rendered
   - Assert: credentials list items present, specialization pills present
   - Assert: CTA button text contains guide name
   - Edge case: guide with no photo → initial letter rendered
   - Edge case: guide with no credentials → credentials section absent
   - Edge case: guide with no specializations → section absent

3. **`GuideDetailBio` tests:**
   - Renders heading with guide name
   - Renders RichText when bio exists
   - Handles `bio: null` gracefully (no crash, no heading)

4. **`GuideStickyCta` tests:**
   - `tourCount > 0` → button visible
   - `tourCount === 0` → returns null (nothing rendered)
   - Click handler: mock `document.getElementById` + `scrollIntoView`, verify called

5. **`GuideToursSection` tests (update existing):**
   - Grid has `lg:grid-cols-2` class (not 3)
   - No `.absolute` price badge in card
   - Price text in card body
   - Duration and rating on same row element

6. **Accessibility checks:**
   - Run `axe-core` or manual check on rendered HTML
   - Verify `h1` (guide name) → `h2` (section headings) hierarchy
   - Verify all `<Image>` have non-empty `alt`
   - Verify CTA buttons have `aria-label` or visible text
   - Verify specialization pill contrast: `#B49042` on `#FEF3C7` — calculate ratio (should be ~3.5:1, may fail AA for small text; document finding)

7. **Full suite run:** `npm test` — all tests pass

## Todo
- [ ] Write `getCredentialIcon` tests
- [ ] Write `GuideDetailSidebar` tests (happy path + edge cases)
- [ ] Write `GuideDetailBio` tests
- [ ] Write `GuideStickyCta` tests
- [ ] Update `GuideToursSection` tests
- [ ] Accessibility audit (heading order, alt text, contrast)
- [ ] Full test suite passes (`npm test`)
- [ ] Document any WCAG contrast findings

## Success Criteria
- All new tests pass
- All existing 1009 tests pass
- 90%+ coverage maintained
- No accessibility regressions (heading hierarchy, alt text)
- Contrast findings documented (specialization pill amber may need attention)

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Server component testing complexity | Medium | Medium | Follow existing patterns in test suite; mock `getTranslations` |
| Amber pill fails WCAG AA contrast | High | Medium | Document as known issue; propose darker text or larger font as fix |
| Existing test expectations break | Medium | Medium | Update assertions to match new layout (grid-cols-2 vs 3) |

## Security Considerations
None — test code only.

## Next Steps
After all tests pass: ready for code review and merge. File PR against `master`.
