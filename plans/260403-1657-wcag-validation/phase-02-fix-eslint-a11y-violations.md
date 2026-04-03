# Phase 2: Fix ESLint A11y Violations

**Priority:** High
**Status:** completed
**Effort:** Medium (~2-4 hrs depending on violation count)
**Depends on:** Phase 1

## Overview
Fix all eslint-plugin-jsx-a11y violations identified in Phase 1. Prioritize by severity.

## Implementation Steps

### 1. Triage violations
Group by rule and fix in this order:
1. **Critical** — `alt-text`, `label-has-associated-control` (screen reader blind spots)
2. **Important** — `click-events-have-key-events`, `no-static-element-interactions` (keyboard access)
3. **Moderate** — `anchor-is-valid`, `heading-has-content`, `aria-*` rules

### 2. Common fixes

**Missing alt text on images:**
```tsx
// Bad
<Image src={...} />
// Good
<Image src={...} alt="Guide portrait in Stockholm" />
// Decorative
<Image src={...} alt="" role="presentation" />
```

**Click events without keyboard:**
```tsx
// Bad
<div onClick={handleClick}>...</div>
// Good
<button onClick={handleClick}>...</button>
// Or if div needed:
<div onClick={handleClick} onKeyDown={handleKeyDown} role="button" tabIndex={0}>...</div>
```

**Form labels:**
```tsx
// Bad
<input type="text" placeholder="Name" />
// Good
<label htmlFor="name">Name</label>
<input id="name" type="text" />
```

### 3. Verify fixes
```bash
npm run lint
```
Must be zero jsx-a11y errors.

## Files to Modify
- Components in `apps/web/components/` (likely multiple)
- Pages with forms: `contact/page.tsx`, `find-tour/page.tsx`
- Tour/guide cards with images and click handlers

## Success Criteria
- [x] Zero jsx-a11y lint errors (9 fixed: dialog, card, language-switcher, video-highlight)
- [x] All existing unit tests still pass
- [x] No visual regressions

## Risks
- High violation count could mean larger effort
- Semantic HTML changes (div→button) may affect styling — test visually
