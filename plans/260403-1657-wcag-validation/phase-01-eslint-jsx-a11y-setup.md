# Phase 1: ESLint jsx-a11y Setup

**Priority:** High
**Status:** completed
**Effort:** Small (~30 min)

## Overview
Add `eslint-plugin-jsx-a11y` to ESLint 9 flat config for static accessibility analysis at dev time.

## Requirements
- Plugin must work with ESLint 9 flat config (mjs format)
- Use recommended ruleset as baseline
- Zero new lint errors on existing code (fix in Phase 2)

## Implementation Steps

### 1. Install plugin
```bash
cd apps/web
npm install --save-dev eslint-plugin-jsx-a11y
```

### 2. Update ESLint config
Update `apps/web/eslint.config.mjs`:
```js
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  jsxA11y.flatConfigs.recommended,
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**', 'payload-types.ts', 'next-env.d.ts'],
  },
]

export default eslintConfig
```

**Note:** `eslint-plugin-jsx-a11y` v7+ exports `flatConfigs.recommended` for ESLint 9 flat config. If using v6, use compat wrapper. Check latest docs.

### 3. Run lint to identify violations
```bash
npm run lint 2>&1 | tee a11y-lint-report.txt
```

### 4. Catalog violations for Phase 2
Count and categorize violations by rule. Common rules:
- `jsx-a11y/alt-text` — missing alt on images
- `jsx-a11y/anchor-is-valid` — invalid anchor usage
- `jsx-a11y/click-events-have-key-events` — click without keyboard
- `jsx-a11y/no-static-element-interactions` — div/span with handlers
- `jsx-a11y/label-has-associated-control` — form inputs without labels

## Files to Modify
- `apps/web/package.json` (new dependency)
- `apps/web/eslint.config.mjs` (add plugin)

## Success Criteria
- [x] `eslint-plugin-jsx-a11y` installed
- [x] ESLint config updated with flat config integration (rules-only spread to avoid plugin conflict)
- [x] `npm run lint` runs without crashing — 9 jsx-a11y violations found in 4 files
- [x] Violation report generated for Phase 2

## Risks
- jsx-a11y flat config export may differ by version — verify docs
- Possible rule conflicts with next/core-web-vitals — test overlap
