# Phase 3 — Imagery, Component & Metadata Broadening

## Context Links

- [plan.md](./plan.md)
- [Phase 1 mapping](./phase-01-content-prep-and-en-verification.md)
- [Phase 2 translations](./phase-02-translation-file-updates.md)

## Overview

- **Priority:** P2
- **Status:** Pending
- **Description:** Update components and assets to match Sweden-wide framing. Three concrete changes: (1) reduce story section paragraphs from 6 to 5; (2) swap hero image from Stockholm Old Town alley to a Sweden-wide visual; (3) verify SEO meta uses the broadened `about.title`/`about.description` from translations. Story image and Responsible Tourism image alts already updated in Phase 2; this phase confirms component image src reflects broader scope.

## Key Insights

- **Story component change is structural.** Currently maps `paragraph1`–`paragraph3` (with `paragraph3` rendered as a `<blockquote>` italic pull-quote). New structure: 5 paragraphs total. Mapping:
  - `paragraph1` → opener (italic emphasis OK)
  - `paragraph2` → secondary opener
  - `paragraph3` → body
  - `paragraph4` → body
  - `paragraph5` → closing punch line (good candidate for blockquote treatment: "What connects everything we offer is not the format. It is the quality of the people behind it.")
  - **Note:** Current component only renders 3 keys (`paragraph1`, `paragraph2`, blockquote of `paragraph3`). The other keys `paragraph4`–`paragraph6` exist in JSON but are NOT rendered. Verify this against the actual component code before deciding the change.
- **Hero image.** Current `apps/web/components/pages/about-hero-section.tsx` uses an Unsplash photo of Stockholm's Old Town. Replace with a Sweden-wide visual — recommended: a landscape composition (archipelago, forest path, or wide cityscape that's not exclusively Stockholm). Keep using Unsplash to stay consistent with the rest of the codebase.
- **Story image.** Currently a Stockholm narrow alley. Acceptable to keep — the story alt text is updated to "Sweden's diverse landscapes" but the image remains a city scene. Cleaner: swap to a more neutral image. **Default: keep current image (lower risk)**, just update alt.
- **Responsible Tourism image.** Already a "nature/waterfront" composition. Keep image, alt text updated in Phase 2.
- **SEO metadata** lives in the page's `generateMetadata` function via `t('title')` and `t('description')`. Since these translation keys are updated in Phase 2, no code change needed here. Verify in Phase 4.

## Requirements

**Functional:**
- Story section component renders the new content shape (let user see all relevant body copy)
- Hero image broadened to Sweden-wide composition
- Tests still pass after component updates

**Non-Functional:**
- Component file stays under 200 lines
- No new imports unless necessary
- Tailwind classes unchanged unless layout requires

## Architecture

```
about-story-section.tsx
  before: title (2 lines) + paragraph1 + paragraph2 + blockquote(paragraph3)
  after:  title (2 lines) + paragraph1 (lead) + paragraph2 + paragraph3 + paragraph4 + blockquote(paragraph5)
```

The blockquote treatment moves to the punch line at the end (paragraph5).

## Related Code Files

**Modify:**
- `apps/web/components/pages/about-story-section.tsx`
- `apps/web/components/pages/about-hero-section.tsx`
- `apps/web/components/pages/__tests__/*` (if tests exist for these — verify and update accordingly)

**Read for context:**
- `apps/web/components/pages/about-mission-vision-section.tsx`
- `apps/web/components/pages/about-responsible-tourism-section.tsx`
- `apps/web/app/(site)/[locale]/(frontend)/about-us/page.tsx`

**No new files. No deletions.**

## Implementation Steps

1. **Story section component update:**
   - Read `about-story-section.tsx`
   - Verify which keys are currently rendered (looks like 1, 2, blockquote(3))
   - Update render to: lead `<p>` (paragraph1, optional italic) + `<p>` (paragraph2) + `<p>` (paragraph3) + `<p>` (paragraph4) + `<blockquote>` (paragraph5)
   - Keep existing Tailwind class conventions

2. **Hero image swap:**
   - Read `about-hero-section.tsx`
   - Replace Unsplash URL with Sweden-wide composition. Suggested URLs (verify availability):
     - `https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a` (Sweden archipelago)
     - `https://images.unsplash.com/photo-1531176175280-33e81d586a23` (Swedish forest path)
   - Pick one; prefer the most neutral landscape image
   - Update `alt` already handled via translation `about.heroAlt` — no change needed in component

3. **Test updates:**
   - Run existing tests for `about-*-section` components: `npm test -- about`
   - If tests fail due to image URL or paragraph rendering, update assertions to match new content
   - Do NOT relax test rigor — update assertions to new expected values

4. **SEO meta verification (no code change):**
   - Confirm `apps/web/app/(site)/[locale]/(frontend)/about-us/page.tsx` reads `about.title` and `about.description` via `t()` — already does
   - Phase 4 will visually confirm

## Todo

- [ ] Read and update `about-story-section.tsx` to render 5 paragraphs (lead + 3 body + blockquote)
- [ ] Pick and apply Sweden-wide hero image URL
- [ ] Run `npm test -- about` and update any failing snapshots/assertions
- [ ] Verify component file stays < 200 LOC

## Success Criteria

- [ ] Story section renders all 5 paragraphs from new EN/SV/DE copy
- [ ] Hero image is no longer Stockholm-specific
- [ ] All existing about-related tests pass (or are updated with reason)
- [ ] No console warnings about missing translation keys

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Hero image URL is broken/404 | Med | Low | Pick from Unsplash with verified IDs; fallback gradient already in place |
| Story layout breaks at mobile widths with 5 paragraphs | Low | Med | Existing component is responsive; manual Phase 4 check at 390px |
| Test snapshots need regeneration | Med | Low | Update snapshots intentionally, document in commit |

## Security Considerations

- External image URLs — use HTTPS, verify Unsplash domain whitelisted in Next.js image config
- Verify `next.config.ts` allows the new Unsplash image domain (likely already does for current images)

## Next Steps

→ Phase 4 verification (build, lint, browser smoke test).
