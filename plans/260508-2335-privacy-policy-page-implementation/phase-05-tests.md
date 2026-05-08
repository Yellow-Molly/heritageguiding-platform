# Phase 05 — Tests (Unit + i18n Parity + Accessibility)

## Context Links
- Plan: [plan.md](./plan.md)
- Depends on: Phases 1-4 (all implementation done)
- Test stack: Vitest 4.0.17 + React Testing Library + axe-core (existing)
- Reference tests: `apps/web/components/cancellation/__tests__/*.test.tsx`

## Overview
- **Priority:** High
- **Status:** Pending
- **Effort:** ~3-4h
- 9 component test files + i18n parity test + a11y scans. Existing 1009-test suite must not regress.

## Key Insights
- Each component receives props — easy to test with placeholder data, no need to mock `next-intl`.
- `privacy-table-of-contents.tsx` (client) needs `IntersectionObserver` mock (Vitest doesn't provide it).
- i18n parity test compares key paths across `sv.json`, `en.json`, `de.json` — no value comparison.
- Forbidden-content scan: grep for "Adyen", "Heritage Guiding Sweden", "Resend" — must return zero in privacy.* namespace.
- Page-level integration test renders full `/privacy` route, runs axe-core.

## Requirements

### Unit Tests (9 files)
Per component:
- Renders without crashing with valid props
- Renders all required text content
- Anchor IDs present where expected
- ARIA attributes correct (table caption, accordion summary, nav)
- Snapshot of rendered output (small components only — avoid for large composed ones)

### i18n Parity Test
- Recursively walks `privacy.*` in all 3 locales
- Asserts identical key paths (no missing or extra keys)
- Asserts forbidden strings absent: "Adyen", "Heritage Guiding Sweden", "Resend"
- Asserts each Processing row has 4 fields
- Asserts each Sub-Processor row has 5 fields
- Asserts each Right item has 6 fields

### Accessibility Tests
- axe-core scan on rendered `<PrivacyPage />` — zero violations
- Keyboard navigation: Tab order through TOC, Rights accordion, CTAs
- Focus management: drawer opens → focus first item, closes → focus returns to trigger

### Visual / Responsive Tests (optional, light-touch)
- Render at 375px viewport — verify table → card swap (Tailwind `md:` classes)
- Render at 1440px — verify TOC sidebar visible

## Implementation Spec

### Test Files

```
apps/web/components/privacy/__tests__/
├── privacy-hero.test.tsx
├── privacy-table-of-contents.test.tsx
├── privacy-controller-card.test.tsx
├── privacy-processing-table.test.tsx
├── privacy-sub-processor-table.test.tsx
├── privacy-rights-accordion.test.tsx
├── privacy-prose.test.tsx
├── privacy-complaint-callout.test.tsx
└── privacy-contact-cta.test.tsx

apps/web/__tests__/
└── privacy-i18n-parity.test.ts

apps/web/app/(site)/[locale]/(frontend)/privacy/__tests__/
└── privacy-page.a11y.test.tsx
```

### Sample Test Patterns

**Component test (privacy-hero.test.tsx):**
```ts
import { render, screen } from '@testing-library/react'
import { PrivacyHero } from '../privacy-hero'

const props = {
  breadcrumb: [{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }],
  title: 'Privacy Policy',
  subtitle: 'How we use your data',
  updatedChip: { label: 'Updated', date: '2026-05-08' },
}

describe('PrivacyHero', () => {
  it('renders title, subtitle, and updated chip', () => {
    render(<PrivacyHero {...props} />)
    expect(screen.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeInTheDocument()
    expect(screen.getByText(/How we use your data/i)).toBeInTheDocument()
    expect(screen.getByText(/2026-05-08/)).toBeInTheDocument()
  })

  it('renders breadcrumb with home link', () => {
    render(<PrivacyHero {...props} />)
    const home = screen.getByRole('link', { name: /Home/i })
    expect(home).toHaveAttribute('href', '/')
  })
})
```

**i18n parity test (privacy-i18n-parity.test.ts):**
```ts
import sv from '@/messages/sv.json'
import en from '@/messages/en.json'
import de from '@/messages/de.json'

function flatKeys(obj: any, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj).flatMap(([k, v]) => flatKeys(v, prefix ? `${prefix}.${k}` : k))
}

describe('privacy i18n parity', () => {
  const svKeys = flatKeys(sv.privacy).sort()
  const enKeys = flatKeys(en.privacy).sort()
  const deKeys = flatKeys(de.privacy).sort()

  it('SV and EN have identical key paths', () => {
    expect(enKeys).toEqual(svKeys)
  })

  it('SV and DE have identical key paths', () => {
    expect(deKeys).toEqual(svKeys)
  })

  it.each(['Adyen', 'Heritage Guiding Sweden', 'Resend'])(
    'no occurrence of forbidden term: %s',
    term => {
      const json = JSON.stringify({ sv: sv.privacy, en: en.privacy, de: de.privacy })
      expect(json).not.toContain(term)
    }
  )

  it('Processing register has 9 rows in all locales', () => {
    expect(sv.privacy.purposes.rows).toHaveLength(9)
    expect(en.privacy.purposes.rows).toHaveLength(9)
    expect(de.privacy.purposes.rows).toHaveLength(9)
  })

  it('Sub-processor table has 7 rows in all locales', () => {
    expect(sv.privacy.subProcessors.rows).toHaveLength(7)
    expect(en.privacy.subProcessors.rows).toHaveLength(7)
    expect(de.privacy.subProcessors.rows).toHaveLength(7)
  })

  it('Rights enumeration has 8 items in all locales', () => {
    expect(sv.privacy.rights.items).toHaveLength(8)
    expect(en.privacy.rights.items).toHaveLength(8)
    expect(de.privacy.rights.items).toHaveLength(8)
  })
})
```

**TOC test with IntersectionObserver mock:**
```ts
import { render, screen, fireEvent } from '@testing-library/react'
import { PrivacyTableOfContents } from '../privacy-table-of-contents'

class IntersectionObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = ''
  thresholds = []
}
beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
})

const items = [
  { id: 'controller', numeral: '01', label: 'Data Controller' },
  { id: 'rights', numeral: '08', label: 'Your Rights' },
]

describe('PrivacyTableOfContents', () => {
  it('renders desktop sidebar items', () => {
    render(<PrivacyTableOfContents items={items} title="Jump to section" closeLabel="Close" />)
    expect(screen.getByRole('navigation', { name: /Jump to section/i })).toBeInTheDocument()
    expect(screen.getByText(/Data Controller/i)).toBeInTheDocument()
  })

  it('opens mobile drawer on trigger click', () => {
    render(<PrivacyTableOfContents items={items} title="Jump to section" closeLabel="Close" />)
    const trigger = screen.getByRole('button', { name: /Jump to section/i })
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: /Jump to section/i })).toBeInTheDocument()
  })

  it('closes drawer on Escape', () => {
    render(<PrivacyTableOfContents items={items} title="Jump to section" closeLabel="Close" />)
    fireEvent.click(screen.getByRole('button', { name: /Jump to section/i }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

**Accessibility test (privacy-page.a11y.test.tsx):**
```ts
import { axe, toHaveNoViolations } from 'jest-axe'
import { render } from '@testing-library/react'
import PrivacyPage from '../page'

expect.extend(toHaveNoViolations)

describe('PrivacyPage a11y', () => {
  it('has no axe violations (EN)', async () => {
    const ui = await PrivacyPage({ params: Promise.resolve({ locale: 'en' }) })
    const { container } = render(ui)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

## Implementation Steps

### Step 0 — Install jest-axe (validation-locked; jest-axe NOT currently in apps/web)
```bash
cd apps/web
npm install --save-dev jest-axe @types/jest-axe
```
Verify Vitest setup picks up jest-axe matchers — extend `apps/web/vitest.setup.ts` (or create) with:
```ts
import { expect } from 'vitest'
import { toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)
```
Reference vitest.config.ts → `setupFiles: ['./vitest.setup.ts']` if not already wired.

### Step 1 — Component Tests
1. Write 9 component test files following pattern above (focus on rendering + ARIA, not visual styling)

### Step 2 — i18n Parity
2. Write `privacy-i18n-parity.test.ts` with the 5 assertions above

### Step 3 — A11y Test
3. Write `privacy-page.a11y.test.tsx` (EN locale; SV + DE follow same pattern if axe runs cleanly)

### Step 4 — Run Tests
4. Run `npm test -- --run privacy` to scope new tests
5. Run full `npm test` to verify no regressions in existing 1009 tests

## Todo List
- [ ] Write `privacy-hero.test.tsx`
- [ ] Write `privacy-table-of-contents.test.tsx` (with IntersectionObserver mock)
- [ ] Write `privacy-controller-card.test.tsx`
- [ ] Write `privacy-processing-table.test.tsx`
- [ ] Write `privacy-sub-processor-table.test.tsx`
- [ ] Write `privacy-rights-accordion.test.tsx`
- [ ] Write `privacy-prose.test.tsx`
- [ ] Write `privacy-complaint-callout.test.tsx`
- [ ] Write `privacy-contact-cta.test.tsx`
- [ ] Write `privacy-i18n-parity.test.ts`
- [ ] Write `privacy-page.a11y.test.tsx`
- [ ] All new tests pass: `npm test -- privacy`
- [ ] Full suite passes: `npm test` — 1009+ tests still green

## Success Criteria
- 9 component tests + 1 i18n parity + 1 a11y = 11 new test files
- All new tests pass on first run after Phase 4 done
- Full suite (existing + new) all green
- Coverage: privacy components ≥80% (matches site standard)
- axe-core scan: zero violations on rendered page

## Risk Assessment
| Risk | Mitigation |
|---|---|
| IntersectionObserver mock incomplete | Use existing pattern from `tour-grid-layout.test.tsx` |
| jest-axe finds violations from external Header/Footer | Scope axe scan to `<main>` element only |
| Async server component test pattern unfamiliar | Reference cancellation page test setup |
| i18n parity test fragile if next-intl uses dot-paths | Use direct JSON imports (already module-resolvable) |

## Security Considerations
- No live network calls in tests
- No production credentials referenced

## Next Steps
- Phase 6: QA, Lighthouse, commit
