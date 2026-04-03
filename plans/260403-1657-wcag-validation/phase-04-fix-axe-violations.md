# Phase 4: Fix Axe Runtime Violations

**Priority:** High
**Status:** completed
**Effort:** Medium-Large (~3-6 hrs depending on violation count)
**Depends on:** Phase 3

## Overview
Run axe tests from Phase 3, catalog violations, fix them. This phase is iterative: run → fix → run until zero critical/serious violations.

## Implementation Steps

### 1. Run initial audit
```bash
cd e2e
npx playwright test tests/accessibility/ --reporter=list 2>&1 | tee axe-audit-results.txt
```

### 2. Categorize violations by impact
Axe classifies violations into 4 severity levels:
- **Critical** — Fix immediately (e.g., missing landmarks, color contrast below 3:1)
- **Serious** — Fix immediately (e.g., contrast below 4.5:1, missing form labels)
- **Moderate** — Fix after critical/serious (e.g., redundant ARIA roles)
- **Minor** — Fix last (e.g., best practice suggestions)

### 3. Common axe violations and fixes

**Color contrast (color-contrast):**
- Check gold-on-white combinations flagged in scout report
- Use contrast checker tool to verify ratios
- Adjust text color or background to meet 4.5:1 (normal text) / 3:1 (large text)

**Missing landmarks (landmark-one-main, region):**
```tsx
// Ensure each page has:
<header>...</header>
<main>...</main>  // or <main role="main">
<footer>...</footer>
```

**Missing page language (html-has-lang):**
- Should be handled by next-intl — verify `<html lang="en">` in output

**Image alt text (image-alt):**
- CMS images need alt from Payload media collection
- Decorative images: `alt="" role="presentation"`

**Form accessibility (label, input-[type]):**
- Every input needs associated label
- Buttons need accessible names

**Link names (link-name):**
- Icon-only links need `aria-label`
- Empty links need content or aria-label

### 4. Fix and re-run iteratively
After each batch of fixes:
```bash
npx playwright test tests/accessibility/ --reporter=list
```

### 5. Handle edge cases
- **Third-party embeds:** Already excluded via `.exclude('iframe[src*="bokun"]')`
- **Dynamic content:** Wizard steps scanned in Phase 3
- **CMS-driven content:** Alt text, headings from Payload — may need CMS field validation

## Files to Modify
- Components in `apps/web/components/` (contrast, ARIA, landmarks)
- Layout files: `apps/web/app/(site)/[locale]/(frontend)/layout.tsx`
- Page files with forms or interactive elements
- `apps/web/app/globals.css` (contrast fixes)

## Success Criteria
- [x] Zero critical violations across all routes
- [x] Zero serious violations across all routes
- [x] Moderate/minor violations logged but don't fail tests
- [x] All 14 axe Playwright tests pass (13 passed, 1 skipped)
- [x] All existing unit tests still pass
- [x] No visual regressions

## Risks
- Color contrast fixes may require design input — gold/white combo likely fails 4.5:1
- High violation count on first run — prioritize by impact
- CMS content may have a11y issues (missing alt) — fix in CMS or add validation
