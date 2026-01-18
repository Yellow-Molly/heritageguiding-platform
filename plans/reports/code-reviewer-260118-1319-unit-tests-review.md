# Code Review Report: Unit Tests Implementation

**Date:** 2026-01-18
**Reviewer:** code-reviewer
**Scope:** Unit tests for CMS package and Web app
**Status:** ✅ Approved with recommendations

---

## Code Review Summary

### Scope
Files reviewed:
- `packages/cms/__tests__/format-slug.test.ts`
- `packages/cms/__tests__/access-control.test.ts`
- `packages/cms/__tests__/validate-google-maps-url.test.ts`
- `packages/cms/vitest.config.ts`
- `apps/web/lib/__tests__/utils.test.ts`
- `apps/web/lib/__tests__/i18n-format.test.ts`
- `apps/web/lib/__tests__/seo.test.ts`
- `apps/web/vitest.config.ts`

Lines of code analyzed: ~900 lines
Review focus: Test quality, completeness, edge cases, best practices
Test execution: All 139 tests passing (42 CMS + 97 Web)

### Overall Assessment
The unit tests demonstrate solid quality with comprehensive coverage of core functionality. Tests follow Vitest conventions, include proper edge case handling, and are well-organized. All tests pass successfully. Some minor improvements recommended for robustness and maintainability.

---

## Critical Issues
None found.

---

## High Priority Findings

### 1. Missing Edge Case: Unicode/Diacritics in Slug Formatting
**File:** `packages/cms/__tests__/format-slug.test.ts`
**Line:** N/A (missing test)

**Issue:** While Swedish character test exists (line 37-39), it only tests basic Swedish text without special diacritics. The implementation uses `/[^\w-]+/g` which may not handle all Swedish/German special characters properly (å, ä, ö, ü, etc.).

**Impact:** Slugs with diacritics may be unexpectedly stripped instead of transliterated.

**Recommendation:** Add tests for:
```typescript
it('handles Swedish diacritics', () => {
  expect(formatSlug('Måns åker till äppelträdet')).toBe('mans-aker-till-appeltradet')
})

it('handles German umlauts', () => {
  expect(formatSlug('Über München')).toBe('uber-munchen')
})
```

If transliteration not implemented, document expected behavior or add transliteration library.

### 2. Inconsistent Type Safety in Mock Objects
**Files:** `packages/cms/__tests__/access-control.test.ts`, `format-slug.test.ts`
**Lines:** 12, 54

**Issue:** Using `as any` for type assertions bypasses TypeScript safety.

```typescript
// Current
const result = isAdmin({ req: createMockReq({ role: 'admin' }) } as any)

// Better
const result = formatSlugHook({
  // ... all fields properly typed
} as FieldHookArgs)
```

**Impact:** Potential runtime errors if Payload changes Access/FieldHook interfaces.

**Recommendation:** Create proper mock type helpers:
```typescript
type MockAccessArgs = Pick<AccessArgs, 'req'>
const createMockAccessArgs = (user: any): MockAccessArgs => ({ req: { user } })
```

### 3. Regex Test Patterns Too Permissive
**Files:** `apps/web/lib/__tests__/utils.test.ts`, `i18n-format.test.ts`
**Lines:** 33-34, 88-89, etc.

**Issue:** Tests use regex patterns that match multiple valid outputs, making them less specific:
```typescript
expect(result).toMatch(/1[\s\u00a0]?500/)  // Matches "1500", "1 500", "1\u00a0500"
```

**Impact:** Tests may pass even if locale formatting breaks or produces unexpected output.

**Recommendation:** Use exact string matching when possible or document why regex is required:
```typescript
// If exact format is known
expect(result).toBe('1 500 kr')

// If locale differences exist, add comment
// Note: Number formatting varies by locale implementation
expect(result).toMatch(/1[\s\u00a0]500/)
```

---

## Medium Priority Improvements

### 1. Missing Validation Edge Cases
**File:** `packages/cms/__tests__/validate-google-maps-url.test.ts`

Missing tests:
- URLs with query parameters: `https://google.com/maps/place/Stockholm?param=value`
- Very long URLs (500 char limit validation)
- URLs with fragments: `https://google.com/maps#fragment`
- Mixed case protocols: `HtTpS://google.com/maps`
- URLs with auth: `https://user:pass@google.com/maps`

**Recommendation:** Add boundary tests:
```typescript
it('accepts URLs with query parameters', () => {
  expect(validateGoogleMapsUrl('https://google.com/maps?q=test&zoom=15')).toBe(true)
})

it('rejects URLs exceeding max length', () => {
  const longUrl = 'https://google.com/maps/' + 'x'.repeat(500)
  expect(validateGoogleMapsUrl(longUrl)).toBe('Please enter a valid Google Maps URL')
})
```

### 2. Incomplete formatSlugHook Test Coverage
**File:** `packages/cms/__tests__/format-slug.test.ts`

Missing scenarios:
- `operation: 'update'` with existing slug (should format it)
- Multiple spaces/hyphens in title field
- Title with only special characters
- Very long titles (slug length limits)

**Recommendation:** Add:
```typescript
it('formats existing slug on update when provided', () => {
  const result = formatSlugHook({
    value: 'Old Slug With Spaces',
    operation: 'update',
    // ...
  })
  expect(result).toBe('old-slug-with-spaces')
})
```

### 3. Limited Error Scenario Testing
**Files:** All test files

**Issue:** Tests focus on happy paths and basic edge cases but don't test error boundaries:
- Invalid date objects
- Malformed input types
- Extremely large numbers
- NaN/Infinity values

**Recommendation:** Add defensive tests:
```typescript
it('handles invalid date gracefully', () => {
  expect(() => formatDate(new Date('invalid'), 'sv')).not.toThrow()
})

it('handles NaN price', () => {
  expect(() => formatPrice(NaN)).not.toThrow()
})
```

### 4. Environment Variable Dependency
**File:** `apps/web/lib/__tests__/seo.test.ts`
**Lines:** 12-13, 46-50, 160-162

**Issue:** Tests rely on environment variable stubbing with `vi.stubEnv()`. While properly cleaned up with `afterEach`, this creates test interdependence.

**Current:**
```typescript
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com')
})
```

**Recommendation:** Extract URL generation to testable function:
```typescript
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://heritageguiding.com'
}

// Test both with and without env var in isolated describe blocks
```

### 5. Test Organization: Grouping Related Tests
**File:** `apps/web/lib/__tests__/i18n-format.test.ts`

**Issue:** Each locale tested separately in individual `it()` blocks. Consider nested `describe()` for better organization:

**Current:**
```typescript
it('formats date in Swedish locale', () => {})
it('formats date in English locale', () => {})
it('formats date in German locale', () => {})
```

**Better:**
```typescript
describe('formatDate', () => {
  describe('Swedish locale', () => {
    it('formats date correctly', () => {})
  })

  describe('English locale', () => {
    it('formats date correctly', () => {})
  })
})
```

---

## Low Priority Suggestions

### 1. Test Data Constants
Extract magic values to constants for maintainability:

```typescript
const TEST_DATE = new Date('2026-01-15T14:30:00')
const SWEDISH_LOCALE: Locale = 'sv'
const TEST_PRICE = 1500

it('formats price in Swedish locale', () => {
  const result = formatPrice(TEST_PRICE, SWEDISH_LOCALE)
  // ...
})
```

### 2. DRY Principle in Mock Objects
**File:** `packages/cms/__tests__/format-slug.test.ts`
**Lines:** 48-96

Repeated mock structure. Consider helper factory:
```typescript
const createFieldHookArgs = (
  overrides: Partial<FieldHookArgs>
): FieldHookArgs => ({
  value: '',
  data: {},
  operation: 'create',
  originalDoc: undefined,
  req: {} as any,
  siblingData: {},
  field: {} as any,
  collection: undefined,
  context: {},
  previousValue: undefined,
  previousSiblingDoc: undefined,
  ...overrides,
})
```

### 3. Snapshot Testing for SEO Metadata
**File:** `apps/web/lib/__tests__/seo.test.ts`

Consider snapshot testing for complex metadata objects:
```typescript
it('generates complete page metadata', () => {
  const result = generatePageMetadata({
    title: 'Test',
    description: 'Description',
    locale: 'sv',
    pathname: '/test',
  })
  expect(result).toMatchSnapshot()
})
```

### 4. Coverage Thresholds Alignment
**Files:** Vitest configs

Both configs set 80% coverage threshold. Consider:
- Increasing to 85-90% for critical utilities
- Adding per-file thresholds for high-risk code
- Adding branch coverage specific targets

```typescript
thresholds: {
  statements: 85,
  branches: 85,
  functions: 85,
  lines: 85,
  perFile: true,  // Enforce per-file
}
```

### 5. Test Naming Consistency
Most tests follow "should" pattern but some don't:

**Inconsistent:**
```typescript
it('accepts google.com/maps URL', () => {})  // Missing "should"
it('returns true when user is admin', () => {})  // Has verb
```

**Consistent:**
```typescript
it('should accept google.com/maps URL', () => {})
it('should return true when user is admin', () => {})
```

Choose one style and apply consistently.

---

## Positive Observations

### Excellent Practices Observed

1. **Comprehensive Coverage:** Tests cover happy paths, edge cases, empty/null values, and locale variations
2. **Proper Cleanup:** `beforeEach`/`afterEach` hooks properly manage test state (env vars)
3. **Descriptive Names:** Test descriptions clearly state expected behavior
4. **Isolation:** Tests are independent and don't rely on execution order
5. **Type Safety:** Most tests use proper TypeScript types (except mock `as any`)
6. **Configuration:** Vitest configs properly set up with coverage thresholds
7. **Fast Execution:** All 139 tests run in <3 seconds
8. **Locale Testing:** Thorough multilingual support testing across all three locales
9. **Error Handling:** Tests verify both success and failure paths for validation
10. **Regex Validation:** Multiple URL patterns tested for Google Maps validator

### Well-Structured Test Files

- Clear describe/it hierarchy
- Logical grouping of related tests
- Consistent formatting
- Good use of Vitest utilities (stubEnv, etc.)

---

## Recommended Actions

### Immediate (Before Merge)
1. Add transliteration tests for Swedish/German diacritics or document expected behavior
2. Replace `as any` with proper mock types
3. Add query parameter tests for Google Maps URL validation

### Short Term (Next Sprint)
1. Increase test specificity by replacing permissive regex with exact matches where possible
2. Add error boundary tests for invalid inputs
3. Extract environment-dependent logic to testable functions
4. Add missing edge case tests for slug hook (update operation, long titles)

### Long Term (Backlog)
1. Consider snapshot testing for complex objects
2. Refactor test organization with nested describe blocks
3. Increase coverage thresholds to 85%+
4. Add integration tests for full workflows
5. Establish consistent test naming convention across codebase

---

## Metrics

- **Test Files:** 6
- **Total Tests:** 139 (42 CMS + 97 Web)
- **Pass Rate:** 100%
- **Execution Time:** <3s
- **Coverage Target:** 80%
- **Type Coverage:** High (with minor `as any` usage)
- **Linting Issues:** 0
- **Critical Issues:** 0
- **High Priority Issues:** 3
- **Medium Priority Issues:** 5
- **Low Priority Issues:** 5

---

## Conclusion

The test suite demonstrates high quality with comprehensive coverage, proper structure, and adherence to testing best practices. All tests pass successfully with fast execution times. The main recommendations focus on:

1. Enhanced edge case coverage (diacritics, validation boundaries)
2. Improved type safety in mocks
3. More specific test assertions
4. Better test organization

These are refinements to an already solid foundation. The tests are production-ready with the noted improvements recommended for increased robustness.

---

## Unresolved Questions

1. **Slug Transliteration:** Should diacritics be transliterated (å→a, ö→o) or stripped entirely? Current implementation strips them. Is this intended behavior?

2. **URL Length Validation:** The `googleMapsLink` field has `maxLength: 500` in schema. Should validator enforce this or rely on Payload validation?

3. **Locale Fallback:** If Intl formatting fails for a locale, should there be fallback behavior? Currently no tests for this scenario.

4. **Coverage Enforcement:** Should CI fail if coverage drops below 80%? Current config sets thresholds but no evidence of CI integration.

5. **Mock Library:** Consider using dedicated mock library (e.g., `@faker-js/faker`) for test data generation instead of manual mocks?
