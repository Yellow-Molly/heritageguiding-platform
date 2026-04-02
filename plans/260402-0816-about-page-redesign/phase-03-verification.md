# Phase 3: Verification

## Context
- [plan.md](./plan.md)
- [Phase 2](./phase-02-component-implementation.md)

## Overview
- **Priority**: P1
- **Status**: Complete
- **Effort**: 30min
- **Depends on**: Phase 2

## Verification Steps

### 1. JSON Validation
```bash
node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/en.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/sv.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/de.json','utf8'))"
```

### 2. TypeScript Type Check
```bash
npm run type-check
```
Expected: 0 errors. Watch for:
- Missing translation key types
- Incorrect lucide-react icon imports
- Image component prop types

### 3. Lint
```bash
npm run lint
```
Expected: 0 errors. Watch for:
- Unused imports in old page.tsx code removed
- `'use client'` directive placement
- Image alt text requirements

### 4. Build
```bash
npm run build
```
Expected: Successful build. Watch for:
- Next.js Image optimization warnings
- Missing image files (should gracefully degrade)
- Bundle size changes

### 5. Visual Verification
Manual check at two breakpoints:
- Desktop: 1440px width
- Mobile: 390px width

Checklist per section:
- [x] Hero: overlay visible, text centered, divider shows
- [x] Story: side-by-side desktop, stacked mobile (image first)
- [x] Mission/Vision: cards side-by-side desktop, stacked mobile, icons render
- [x] Values: 3+2 grid desktop, single column mobile, icon squares + dividers
- [x] Responsible Tourism: image left desktop, image top mobile, 4 checklist items with green checks
- [x] Certifications: horizontal with vertical dividers desktop, vertical with horizontal dividers mobile
- [x] CTA: buttons horizontal desktop, stacked mobile, icons in buttons

### 6. Locale Switching
- [x] Switch to SV — all about page sections show Swedish text
- [x] Switch to DE — all about page sections show German text
- [x] Switch back to EN — no stale content

### 7. Regression Check
- [x] About page metadata (title, description) still correct
- [x] AboutSchema structured data still renders
- [x] Navigation to/from about page works
- [x] Other pages unaffected (home, tours, contact)

## Todo (Completed)

- [x] Validate all 3 JSON files parse correctly
- [x] Run type-check — 0 errors
- [x] Run lint — 0 errors
- [x] Run build — success
- [x] Visual check desktop 1440px
- [x] Visual check mobile 390px
- [x] Test all 3 locales
- [x] Regression check navigation and SEO

## Success Criteria (All Met)
- [x] All automated checks pass (type-check, lint, build)
- [x] All 7 sections render at both breakpoints (team skipped)
- [x] All 3 locales display correct content
- [x] No regression on existing pages

## Failure Modes & Mitigation
| Failure | Mitigation |
|---------|-----------|
| Type errors in new components | Fix imports, check lucide icon names exist |
| Build fails on Image component | Ensure width/height or fill prop set, add sizes attribute |
| Translation key not found | Verify key path matches JSON nesting exactly |
| Layout broken at mobile | Check flex-col ordering, verify responsive class prefixes |
