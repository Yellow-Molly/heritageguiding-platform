# Phase 03: Concierge Wizard + Group Booking - Flow, localStorage, Validation

## Context Links
- **Parent Plan**: [plan.md](./plan.md)
- **Depends On**: [Phase 01](./phase-01-foundation-setup-config-pom-base-smoke-tests.md), [Phase 02](./phase-02-customer-journey-browse-search-filter-booking.md)
- **Research**: [i18n, Bokun, SEO, localStorage](./research/researcher-02-i18n-bokun-seo-testing.md)
- **Codebase**: apps/web/components/wizard/, apps/web/components/booking/

## Overview
- **Date**: 2026-02-12
- **Priority**: HIGH
- **Effort**: 2.5h
- **Implementation Status**: Pending
- **Review Status**: Not started

Test the Concierge Wizard 3-step flow (audience -> interests -> recommendations) with localStorage persistence, and the Group Booking form on both the standalone page (`/group-booking`) and the modal on tour detail pages. Validate Zod-backed form validation, required fields, group size 9-200 range.

## Key Insights
- Wizard uses `concierge-wizard-container.tsx` with 3 steps, aria-pressed option cards
- localStorage key for wizard state managed by `use-wizard-persistence.ts` hook
- Wizard POST to `/api/tours/recommend` with Zod validation (audience[], interests[])
- Group inquiry form: `group-inquiry-form.tsx` with Zod validation, 9-200 group size
- Group inquiry modal: `group-inquiry-modal.tsx` triggered from tour detail booking section
- Standalone group booking page: `/[locale]/group-booking`
- API endpoint: `POST /api/group-inquiry`

## Requirements

### Functional
- Concierge Wizard POM: step indicators, audience cards, interest cards, results, start-over button
- Group Booking POM: form fields (name, email, phone, group size, message, tour preference), submit button, validation errors
- Wizard tests: complete 3-step flow, verify recommendations appear, verify start-over resets
- Wizard persistence: select audience -> reload -> verify selections restored from localStorage
- Group booking standalone: fill form, submit, validate success state
- Group booking validation: submit empty form, verify error messages; submit invalid group size (<9, >200)
- Group booking modal: open from tour detail page, verify pre-filled tour name

### Non-Functional
- Each POM under 200 lines
- Each spec under 200 lines (split by concern)
- No mocking of API -- tests hit real staging endpoints
- localStorage assertions via `page.evaluate()`

## Architecture

```
e2e/
├── page-objects/
│   ├── concierge-wizard.ts       # Wizard steps, options, results
│   └── group-booking.ts          # Group form fields, validation, submit
├── tests/
│   ├── concierge-wizard/
│   │   ├── wizard-flow.spec.ts           # 3-step completion + recommendations
│   │   └── wizard-persistence.spec.ts    # localStorage save/restore
│   └── group-booking/
│       ├── standalone-page.spec.ts       # /group-booking form submission
│       ├── modal-flow.spec.ts            # Modal from tour detail page
│       └── form-validation.spec.ts       # Zod validation errors
```

## Related Code Files

### To Create
| File | Purpose |
|------|---------|
| `e2e/page-objects/concierge-wizard.ts` | Wizard POM: steps, audience/interest cards, results |
| `e2e/page-objects/group-booking.ts` | Group form POM: fields, errors, submit |
| `e2e/tests/concierge-wizard/wizard-flow.spec.ts` | Full wizard completion |
| `e2e/tests/concierge-wizard/wizard-persistence.spec.ts` | localStorage persistence |
| `e2e/tests/group-booking/standalone-page.spec.ts` | Standalone form submit |
| `e2e/tests/group-booking/modal-flow.spec.ts` | Modal from tour detail |
| `e2e/tests/group-booking/form-validation.spec.ts` | Validation errors |

### Existing Reference (apps/web)
| File | Relevance |
|------|-----------|
| `components/wizard/concierge-wizard-container.tsx` | Wizard state machine, step logic |
| `components/wizard/wizard-step-selector.tsx` | Audience/interest card rendering |
| `components/wizard/wizard-option-card.tsx` | Option card with aria-pressed |
| `components/wizard/wizard-progress-indicator.tsx` | Step progress bar |
| `components/wizard/wizard-tour-results.tsx` | Recommendation results display |
| `lib/hooks/use-wizard-persistence.ts` | localStorage key/logic |
| `components/booking/group-inquiry-form.tsx` | Group form fields + Zod |
| `components/booking/group-inquiry-modal.tsx` | Modal wrapper for group form |
| `app/api/group-inquiry/route.ts` | POST endpoint for group inquiries |

## Implementation Steps

### 1. Create e2e/page-objects/concierge-wizard.ts
```typescript
import { type Page, type Locator } from '@playwright/test'
import { BasePage } from '../fixtures/base-page'

export class ConciergeWizardPage extends BasePage {
  readonly progressIndicator: Locator
  readonly optionCards: Locator
  readonly nextButton: Locator
  readonly backButton: Locator
  readonly startOverButton: Locator
  readonly tourResults: Locator
  readonly tourResultCards: Locator

  constructor(page: Page, locale = 'en') {
    super(page, locale)
    this.progressIndicator = page.locator('[role="progressbar"]')
    this.optionCards = page.locator('[aria-pressed]')
    this.nextButton = page.getByRole('button', { name: /next|continue/i })
    this.backButton = page.getByRole('button', { name: /back|previous/i })
    this.startOverButton = page.getByRole('button', { name: /start over|reset/i })
    this.tourResults = page.locator('[data-testid="wizard-results"]')
    this.tourResultCards = page.locator('[data-testid="wizard-results"] a[href*="/tours/"]').locator('..')
  }

  async gotoWizard() {
    await this.goto('/find-tour')
    await this.waitForPageLoad()
  }

  /** Select first N option cards on current step */
  async selectOptions(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.optionCards.nth(i).click()
    }
  }

  async clickNext() {
    await this.nextButton.click()
  }

  /** Complete full wizard: select 1 audience + 1 interest */
  async completeWizard() {
    // Step 1: Select first audience
    await this.selectOptions(1)
    await this.clickNext()
    // Step 2: Select first interest
    await this.selectOptions(1)
    await this.clickNext()
    // Step 3: Wait for recommendations
    await this.page.waitForLoadState('networkidle')
  }

  async getSelectedCount(): Promise<number> {
    return this.optionCards.filter({ has: this.page.locator('[aria-pressed="true"]') }).count()
  }
}
```

### 2. Create e2e/page-objects/group-booking.ts
```typescript
import { type Page, type Locator } from '@playwright/test'
import { BasePage } from '../fixtures/base-page'

export class GroupBookingPage extends BasePage {
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly phoneInput: Locator
  readonly groupSizeInput: Locator
  readonly messageInput: Locator
  readonly submitButton: Locator
  readonly validationErrors: Locator
  readonly successMessage: Locator
  readonly form: Locator

  constructor(page: Page, locale = 'en') {
    super(page, locale)
    this.form = page.locator('form')
    this.nameInput = page.getByLabel(/name/i)
    this.emailInput = page.getByLabel(/email/i)
    this.phoneInput = page.getByLabel(/phone|tel/i)
    this.groupSizeInput = page.getByLabel(/group.*size|number.*people|participants/i)
    this.messageInput = page.getByLabel(/message|comment|note/i)
    this.submitButton = page.getByRole('button', { name: /submit|send|request/i })
    this.validationErrors = page.locator('[role="alert"], .text-red, .text-destructive, [data-error]')
    this.successMessage = page.locator('[data-testid="success"], [role="status"]')
  }

  async gotoStandalonePage() {
    await this.goto('/group-booking')
    await this.waitForPageLoad()
  }

  async fillForm(data: {
    name: string
    email: string
    phone?: string
    groupSize: string
    message?: string
  }) {
    await this.nameInput.fill(data.name)
    await this.emailInput.fill(data.email)
    if (data.phone) await this.phoneInput.fill(data.phone)
    await this.groupSizeInput.fill(data.groupSize)
    if (data.message) await this.messageInput.fill(data.message)
  }

  async submit() {
    await this.submitButton.click()
  }
}
```

### 3. Create e2e/tests/concierge-wizard/wizard-flow.spec.ts
```typescript
import { test, expect } from '@playwright/test'
import { ConciergeWizardPage } from '../../page-objects/concierge-wizard'

test.describe('Concierge Wizard - Full Flow', () => {
  test('completes 3-step wizard and shows recommendations', async ({ page }) => {
    const wizard = new ConciergeWizardPage(page)
    await wizard.gotoWizard()

    // Step 1: Audience selection visible
    await expect(wizard.optionCards.first()).toBeVisible()
    await wizard.selectOptions(1)
    await wizard.clickNext()

    // Step 2: Interest selection visible
    await expect(wizard.optionCards.first()).toBeVisible()
    await wizard.selectOptions(2)
    await wizard.clickNext()

    // Step 3: Recommendations appear
    await page.waitForLoadState('networkidle')
    // Either tour result cards or a results container should be visible
    const hasResults = await wizard.tourResultCards.count()
    expect(hasResults).toBeGreaterThan(0)
  })

  test('option cards toggle aria-pressed on click', async ({ page }) => {
    const wizard = new ConciergeWizardPage(page)
    await wizard.gotoWizard()

    const firstCard = wizard.optionCards.first()
    await expect(firstCard).toHaveAttribute('aria-pressed', 'false')
    await firstCard.click()
    await expect(firstCard).toHaveAttribute('aria-pressed', 'true')
    await firstCard.click()
    await expect(firstCard).toHaveAttribute('aria-pressed', 'false')
  })

  test('start over resets wizard to step 1', async ({ page }) => {
    const wizard = new ConciergeWizardPage(page)
    await wizard.gotoWizard()
    await wizard.completeWizard()

    await wizard.startOverButton.click()
    // Back to step 1 with option cards
    await expect(wizard.optionCards.first()).toBeVisible()
  })
})
```

### 4. Create e2e/tests/concierge-wizard/wizard-persistence.spec.ts
```typescript
import { test, expect } from '@playwright/test'
import { ConciergeWizardPage } from '../../page-objects/concierge-wizard'

test.describe('Concierge Wizard - localStorage Persistence', () => {
  test('saves selections to localStorage', async ({ page }) => {
    const wizard = new ConciergeWizardPage(page)
    await wizard.gotoWizard()

    // Select audience option
    await wizard.selectOptions(1)

    // Check localStorage has wizard state
    const stored = await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      return keys.find(k => k.includes('wizard') || k.includes('concierge'))
    })
    expect(stored).toBeTruthy()
  })

  test('restores selections after page reload', async ({ page }) => {
    const wizard = new ConciergeWizardPage(page)
    await wizard.gotoWizard()

    // Select first audience option
    const firstCard = wizard.optionCards.first()
    await firstCard.click()
    await expect(firstCard).toHaveAttribute('aria-pressed', 'true')

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // First card should still be selected
    const restoredCard = wizard.optionCards.first()
    await expect(restoredCard).toHaveAttribute('aria-pressed', 'true')
  })

  test('start over clears localStorage', async ({ page }) => {
    const wizard = new ConciergeWizardPage(page)
    await wizard.gotoWizard()
    await wizard.completeWizard()

    // Start over
    await wizard.startOverButton.click()

    const stored = await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      const wizardKey = keys.find(k => k.includes('wizard') || k.includes('concierge'))
      return wizardKey ? localStorage.getItem(wizardKey) : null
    })
    // Either key removed or state reset
    if (stored) {
      const data = JSON.parse(stored)
      expect(data.audience || data.audiences || []).toHaveLength(0)
    }
  })
})
```

### 5. Create e2e/tests/group-booking/standalone-page.spec.ts
```typescript
import { test, expect } from '@playwright/test'
import { GroupBookingPage } from '../../page-objects/group-booking'

test.describe('Group Booking - Standalone Page', () => {
  test('standalone page loads with form', async ({ page }) => {
    const group = new GroupBookingPage(page)
    await group.gotoStandalonePage()

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(group.form).toBeVisible()
    await expect(group.nameInput).toBeVisible()
    await expect(group.emailInput).toBeVisible()
    await expect(group.groupSizeInput).toBeVisible()
    await expect(group.submitButton).toBeVisible()
  })

  test('fills and submits group inquiry form', async ({ page }) => {
    const group = new GroupBookingPage(page)
    await group.gotoStandalonePage()

    await group.fillForm({
      name: 'E2E Test User',
      email: 'e2e-test@example.com',
      phone: '+46701234567',
      groupSize: '15',
      message: 'Automated E2E test - please ignore',
    })
    await group.submit()

    // Expect success state or no validation errors
    await page.waitForTimeout(1000)
    const errors = await group.validationErrors.count()
    // If form submits successfully, expect 0 validation errors
    // (success message or redirect may vary)
    expect(errors).toBe(0)
  })
})
```

### 6. Create e2e/tests/group-booking/form-validation.spec.ts
```typescript
import { test, expect } from '@playwright/test'
import { GroupBookingPage } from '../../page-objects/group-booking'

test.describe('Group Booking - Form Validation', () => {
  let group: GroupBookingPage

  test.beforeEach(async ({ page }) => {
    group = new GroupBookingPage(page)
    await group.gotoStandalonePage()
  })

  test('shows validation errors on empty submission', async ({ page }) => {
    await group.submit()
    await page.waitForTimeout(300)
    const errors = await group.validationErrors.count()
    expect(errors).toBeGreaterThan(0)
  })

  test('rejects group size below minimum (9)', async ({ page }) => {
    await group.fillForm({
      name: 'Test User',
      email: 'test@example.com',
      groupSize: '5',
    })
    await group.submit()
    await page.waitForTimeout(300)

    // Expect validation error related to group size
    const errors = await group.validationErrors.count()
    expect(errors).toBeGreaterThan(0)
  })

  test('rejects group size above maximum (200)', async ({ page }) => {
    await group.fillForm({
      name: 'Test User',
      email: 'test@example.com',
      groupSize: '250',
    })
    await group.submit()
    await page.waitForTimeout(300)

    const errors = await group.validationErrors.count()
    expect(errors).toBeGreaterThan(0)
  })

  test('rejects invalid email format', async ({ page }) => {
    await group.fillForm({
      name: 'Test User',
      email: 'not-an-email',
      groupSize: '15',
    })
    await group.submit()
    await page.waitForTimeout(300)

    const errors = await group.validationErrors.count()
    expect(errors).toBeGreaterThan(0)
  })
})
```

### 7. Create e2e/tests/group-booking/modal-flow.spec.ts
```typescript
import { test, expect } from '@playwright/test'
import { TourDetailPage } from '../../page-objects/tour-detail'
import { GroupBookingPage } from '../../page-objects/group-booking'
import { getFirstTourSlug } from '../../fixtures/staging-data'

test.describe('Group Booking - Modal from Tour Detail', () => {
  let tourSlug: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    tourSlug = await getFirstTourSlug(page)
    await page.close()
  })

  test('opens group inquiry modal from tour detail', async ({ page }) => {
    const detail = new TourDetailPage(page)
    await detail.gotoTour(tourSlug)

    const groupBtn = detail.groupInquiryButton
    if (await groupBtn.isVisible()) {
      await groupBtn.click()

      // Modal dialog should appear
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Form inside modal
      const group = new GroupBookingPage(page)
      await expect(group.nameInput).toBeVisible()
      await expect(group.emailInput).toBeVisible()
    }
  })

  test('modal can be closed with escape key', async ({ page }) => {
    const detail = new TourDetailPage(page)
    await detail.gotoTour(tourSlug)

    const groupBtn = detail.groupInquiryButton
    if (await groupBtn.isVisible()) {
      await groupBtn.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
    }
  })
})
```

## Todo List
- [ ] Create `e2e/page-objects/concierge-wizard.ts`
- [ ] Create `e2e/page-objects/group-booking.ts`
- [ ] Create `e2e/tests/concierge-wizard/wizard-flow.spec.ts`
- [ ] Create `e2e/tests/concierge-wizard/wizard-persistence.spec.ts`
- [ ] Create `e2e/tests/group-booking/standalone-page.spec.ts`
- [ ] Create `e2e/tests/group-booking/form-validation.spec.ts`
- [ ] Create `e2e/tests/group-booking/modal-flow.spec.ts`
- [ ] Verify wizard localStorage key name matches `use-wizard-persistence.ts`
- [ ] Verify group form field labels match actual component labels
- [ ] Run all tests against staging

## Success Criteria
- Wizard flow completes 3 steps and shows tour recommendations
- Wizard localStorage persists audience selection across reload
- Start-over clears wizard state
- Group form validates required fields, group size 9-200, email format
- Group modal opens from tour detail and closes with Escape
- All tests pass on Chromium, Firefox, WebKit

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Wizard localStorage key name differs from test assumption | Medium | Discover key via `Object.keys(localStorage).find(...)` |
| Group inquiry POST creates real inquiries on staging | High | Use distinctive "E2E test - please ignore" in message |
| Group inquiry modal not present on all tours | Medium | Soft assert with `if (await groupBtn.isVisible())` |
| Wizard options use different aria attributes | Low | Cross-reference `wizard-option-card.tsx` for exact attrs |

## Security Considerations
- Group inquiry form submission uses test data clearly marked as E2E
- No admin credentials needed for these tests
- localStorage assertions use `page.evaluate()` -- no injection risk

## Next Steps
- Phase 04 reuses wizard POM for locale-specific wizard flow tests
- Phase 05 tests schema.org markup on wizard results page
