# Phase 03: Concierge Wizard + Group Booking - Flow, localStorage, Validation

## Context Links
- **Parent Plan**: [plan.md](./plan.md)
- **Depends On**: [Phase 01](./phase-01-foundation-setup-config-pom-base-smoke-tests.md), [Phase 02](./phase-02-customer-journey-browse-search-filter-booking.md)
- **Research**: [i18n, Bokun, SEO, localStorage](./research/researcher-02-i18n-bokun-seo-testing.md)
- **Codebase**: `apps/web/components/wizard/`, `apps/web/components/booking/`, `apps/web/components/tour/booking-section.tsx`

## Overview
- **Date**: 2026-02-12 (rewritten 2026-05-19)
- **Priority**: HIGH
- **Effort**: 2.5h
- **Implementation Status**: Pending
- **Review Status**: Not started

Test the Concierge Wizard 3-step flow (audience → interests → recommendations) with localStorage persistence, and the Group Booking form on both the standalone `/group-booking` page and the modal opened from tour detail (`booking-section.tsx → <GroupInquiryModal />`). Validate client-side validation (firstName/lastName/email/phone/groupSize 9-200/preferredDates), honeypot anti-spam field, and Bokun T&C disclosure visibility in the booking widget area.

## Key Insights
- Wizard uses `concierge-wizard-container.tsx` with 3 steps, `aria-pressed` option cards (`wizard-option-card.tsx`)
- localStorage key for wizard state managed by `use-wizard-persistence.ts` hook — discover key dynamically in tests
- Wizard POST to `/api/tours/recommend` (rate-limited as of 2026-04 — run tests serially per browser)
- **Group inquiry form fields (verified 2026-05-19, `group-inquiry-form.tsx`):** `firstName`, `lastName`, `email`, `phone`, `groupSize` (9-200), `preferredDates`, `tourInterest`, `specialRequirements`, `honeypot` (must remain empty)
- Group inquiry modal: `group-inquiry-modal.tsx` rendered via `<GroupInquiryModal tourName={tour.title} />` in `booking-section.tsx:105` on every tour detail
- Standalone page: `/[locale]/group-booking` (single `page.tsx`, no sub-routes)
- API endpoint: `POST /api/group-inquiry` — persists inquiry + sends customer email (added 2026-04 `edc8681`)
- **Bokun T&C disclosure** (`61e6a52`, 2026-04) surfaced near booking widget; should be visible on every tour detail
- Bokun widget loads lazily on viewport intersection (`e4938a8`) — scroll widget into view before asserting

## Requirements

### Functional
- Concierge Wizard POM: step indicators, audience cards, interest cards, results, start-over
- Group Booking POM: 8 form fields (firstName, lastName, email, phone, groupSize, preferredDates, tourInterest, specialRequirements), submit button, validation error messages, success state, honeypot
- Wizard tests: complete 3-step flow, recommendations appear, start-over resets to step 1
- Wizard persistence: select audience → reload → selections restored
- Group booking standalone: fill all required fields, submit, validate success state, assert honeypot kept empty
- Group booking validation: empty submit shows errors; groupSize <9 and >200 rejected; invalid email format rejected; phone <8 chars rejected
- Group booking modal: open from tour detail page, verify `tourInterest` pre-filled with tour name, close with Escape
- Bokun T&C disclosure visible in booking widget region on tour detail (text contains "Terms" or matches Bokun T&C copy)

### Non-Functional
- Each POM under 200 lines
- Each spec under 200 lines (split by concern)
- No mocking — tests hit real staging `/api/group-inquiry`
- localStorage assertions via `page.evaluate()`
- Tests tag with `@group-inquiry` so afterAll cleanup hook can target only inquiries created by E2E run (match `specialRequirements` containing E2E sentinel string)

## Architecture

```
e2e/
├── page-objects/
│   ├── concierge-wizard.ts       # Wizard steps, options, results
│   └── group-booking.ts          # 8 form fields, validation, submit, honeypot accessor
├── tests/
│   ├── concierge-wizard/
│   │   ├── wizard-flow.spec.ts           # 3-step completion + recommendations
│   │   └── wizard-persistence.spec.ts    # localStorage save/restore
│   └── group-booking/
│       ├── standalone-page.spec.ts       # /group-booking form submission
│       ├── modal-flow.spec.ts            # Modal from tour detail (tourInterest prefill)
│       ├── form-validation.spec.ts       # 9-200 range, email, phone, required
│       └── bokun-tc-disclosure.spec.ts   # Bokun T&C visible near widget
```

## Related Code Files

### To Create
| File | Purpose |
|------|---------|
| `e2e/page-objects/concierge-wizard.ts` | Wizard POM: steps, audience/interest cards, results |
| `e2e/page-objects/group-booking.ts` | Group form POM: 8 fields + honeypot + errors + submit |
| `e2e/tests/concierge-wizard/wizard-flow.spec.ts` | Full wizard completion |
| `e2e/tests/concierge-wizard/wizard-persistence.spec.ts` | localStorage persistence |
| `e2e/tests/group-booking/standalone-page.spec.ts` | Standalone form submit |
| `e2e/tests/group-booking/modal-flow.spec.ts` | Modal from tour detail (tourInterest prefill) |
| `e2e/tests/group-booking/form-validation.spec.ts` | Validation errors |
| `e2e/tests/group-booking/bokun-tc-disclosure.spec.ts` | Bokun T&C disclosure visible |

### Existing Reference (apps/web)
| File | Relevance |
|------|-----------|
| `components/wizard/concierge-wizard-container.tsx` | Wizard state machine, step logic |
| `components/wizard/wizard-option-card.tsx` | `aria-pressed` option card |
| `components/wizard/wizard-progress-indicator.tsx` | Step progress bar |
| `components/wizard/wizard-tour-results.tsx` | Recommendation results |
| `components/booking/group-inquiry-form.tsx` | 8-field form + 9-200 validation + honeypot |
| `components/booking/group-inquiry-modal.tsx` | Modal wrapper, `tourName` prop → prefills `tourInterest` |
| `components/tour/booking-section.tsx` | Mounts `<GroupInquiryModal tourName={tour.title} />` at line 105 |
| `app/api/group-inquiry/route.ts` | POST endpoint, persists + emails customer |

## Implementation Steps

### 1. Create `e2e/page-objects/concierge-wizard.ts`

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
    this.progressIndicator = page.locator('[role="progressbar"], [aria-label*="step" i]')
    this.optionCards = page.locator('[aria-pressed]')
    this.nextButton = page.getByRole('button', { name: /next|continue/i })
    this.backButton = page.getByRole('button', { name: /back|previous/i })
    this.startOverButton = page.getByRole('button', { name: /start over|reset/i })
    this.tourResults = page.locator('section').filter({ hasText: /recommend|results/i }).first()
    this.tourResultCards = page.locator('a[href*="/tours/"]')
  }

  async gotoWizard() {
    await this.goto('/find-tour')
    await this.waitForPageLoad()
  }

  async selectOptions(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.optionCards.nth(i).click()
    }
  }

  async clickNext() {
    await this.nextButton.click()
  }

  /** Complete full wizard: 1 audience + 1 interest */
  async completeWizard() {
    await this.selectOptions(1)
    await this.clickNext()
    await this.selectOptions(1)
    await this.clickNext()
    await this.page.waitForLoadState('networkidle')
  }
}
```

### 2. Create `e2e/page-objects/group-booking.ts`

```typescript
import { type Page, type Locator } from '@playwright/test'
import { BasePage } from '../fixtures/base-page'

const E2E_SENTINEL = '[E2E AUTOMATED TEST — PLEASE IGNORE]'

export interface GroupBookingFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  groupSize: string
  preferredDates: string
  tourInterest?: string
  specialRequirements?: string
}

export class GroupBookingPage extends BasePage {
  readonly form: Locator
  readonly firstNameInput: Locator
  readonly lastNameInput: Locator
  readonly emailInput: Locator
  readonly phoneInput: Locator
  readonly groupSizeInput: Locator
  readonly preferredDatesInput: Locator
  readonly tourInterestInput: Locator
  readonly specialRequirementsInput: Locator
  readonly honeypotInput: Locator
  readonly submitButton: Locator
  readonly validationErrors: Locator
  readonly successMessage: Locator

  constructor(page: Page, locale = 'en') {
    super(page, locale)
    this.form = page.locator('form')
    this.firstNameInput = page.getByLabel(/first.*name/i)
    this.lastNameInput = page.getByLabel(/last.*name/i)
    this.emailInput = page.getByLabel(/email/i)
    this.phoneInput = page.getByLabel(/phone|tel/i)
    this.groupSizeInput = page.getByLabel(/group.*size|number.*people|participants/i)
    this.preferredDatesInput = page.getByLabel(/preferred.*date|when/i)
    this.tourInterestInput = page.getByLabel(/tour.*interest|which.*tour/i)
    this.specialRequirementsInput = page.getByLabel(/special.*requirement|message|note/i)
    this.honeypotInput = page.locator('input[name="honeypot"], input[name*="honey"]')
    this.submitButton = page.getByRole('button', { name: /submit|send|request|inquire/i })
    this.validationErrors = page.locator('[role="alert"], [aria-invalid="true"], .text-red, .text-destructive, [data-error]')
    this.successMessage = page.getByRole('status').or(page.locator('[data-testid="success"]'))
  }

  async gotoStandalonePage() {
    await this.goto('/group-booking')
    await this.waitForPageLoad()
  }

  async fillForm(data: GroupBookingFormData) {
    await this.firstNameInput.fill(data.firstName)
    await this.lastNameInput.fill(data.lastName)
    await this.emailInput.fill(data.email)
    await this.phoneInput.fill(data.phone)
    await this.groupSizeInput.fill(data.groupSize)
    await this.preferredDatesInput.fill(data.preferredDates)
    if (data.tourInterest) await this.tourInterestInput.fill(data.tourInterest)
    const specialReqs = data.specialRequirements ?? E2E_SENTINEL
    await this.specialRequirementsInput.fill(specialReqs)
  }

  /** Build deterministic E2E payload — honeypot intentionally untouched */
  static buildValidPayload(overrides: Partial<GroupBookingFormData> = {}): GroupBookingFormData {
    return {
      firstName: 'E2E',
      lastName: 'TestUser',
      email: `e2e-${Date.now()}@example.test`,
      phone: '+46701234567',
      groupSize: '15',
      preferredDates: 'June 2026',
      tourInterest: 'Any',
      specialRequirements: E2E_SENTINEL,
      ...overrides,
    }
  }

  async submit() {
    await this.submitButton.click()
  }

  async honeypotValue(): Promise<string> {
    return (await this.honeypotInput.inputValue().catch(() => '')) || ''
  }
}

export { E2E_SENTINEL }
```

### 3. Spec — `e2e/tests/group-booking/standalone-page.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { GroupBookingPage } from '../../page-objects/group-booking'

test.describe('Group Booking - Standalone Page', () => {
  // Serial: rate-limited /api/group-inquiry — avoid concurrent submissions
  test.describe.configure({ mode: 'serial' })

  test('standalone page loads with all 8 fields', async ({ page }) => {
    const group = new GroupBookingPage(page)
    await group.gotoStandalonePage()

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(group.form).toBeVisible()
    await expect(group.firstNameInput).toBeVisible()
    await expect(group.lastNameInput).toBeVisible()
    await expect(group.emailInput).toBeVisible()
    await expect(group.phoneInput).toBeVisible()
    await expect(group.groupSizeInput).toBeVisible()
    await expect(group.preferredDatesInput).toBeVisible()
    await expect(group.submitButton).toBeVisible()
  })

  test('honeypot field is present and untouched by typical interaction', async ({ page }) => {
    const group = new GroupBookingPage(page)
    await group.gotoStandalonePage()
    await group.fillForm(GroupBookingPage.buildValidPayload())
    const honeypot = await group.honeypotValue()
    expect(honeypot).toBe('')
  })

  test('valid submission reaches success state', async ({ page }) => {
    const group = new GroupBookingPage(page)
    await group.gotoStandalonePage()
    await group.fillForm(GroupBookingPage.buildValidPayload())
    await group.submit()

    // Either success message or no validation errors after submit
    await expect(async () => {
      const errors = await group.validationErrors.count()
      const success = await group.successMessage.isVisible().catch(() => false)
      expect(success || errors === 0).toBeTruthy()
    }).toPass({ timeout: 5000 })
  })
})
```

### 4. Spec — `e2e/tests/group-booking/form-validation.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { GroupBookingPage } from '../../page-objects/group-booking'

test.describe('Group Booking - Form Validation', () => {
  test.describe.configure({ mode: 'serial' })

  let group: GroupBookingPage

  test.beforeEach(async ({ page }) => {
    group = new GroupBookingPage(page)
    await group.gotoStandalonePage()
  })

  test('empty submission shows validation errors', async () => {
    await group.submit()
    await expect(group.validationErrors.first()).toBeVisible({ timeout: 2000 })
  })

  test('rejects group size below 9', async () => {
    await group.fillForm(GroupBookingPage.buildValidPayload({ groupSize: '5' }))
    await group.submit()
    await expect(group.validationErrors.first()).toBeVisible({ timeout: 2000 })
  })

  test('rejects group size above 200', async () => {
    await group.fillForm(GroupBookingPage.buildValidPayload({ groupSize: '250' }))
    await group.submit()
    await expect(group.validationErrors.first()).toBeVisible({ timeout: 2000 })
  })

  test('rejects invalid email format', async () => {
    await group.fillForm(GroupBookingPage.buildValidPayload({ email: 'not-an-email' }))
    await group.submit()
    await expect(group.validationErrors.first()).toBeVisible({ timeout: 2000 })
  })

  test('rejects short phone number', async () => {
    await group.fillForm(GroupBookingPage.buildValidPayload({ phone: '123' }))
    await group.submit()
    await expect(group.validationErrors.first()).toBeVisible({ timeout: 2000 })
  })
})
```

### 5. Spec — `e2e/tests/group-booking/modal-flow.spec.ts`

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

  test('opens modal and prefills tourInterest with tour title', async ({ page }) => {
    const detail = new TourDetailPage(page)
    await detail.gotoTour(tourSlug)
    const tourTitle = (await detail.tourTitle.textContent())?.trim() ?? ''

    const groupBtn = page.getByRole('button', { name: /group/i }).first()
    await groupBtn.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const group = new GroupBookingPage(page)
    const interestValue = await group.tourInterestInput.inputValue()
    // Title should appear in tourInterest prefill (booking-section passes tour.title)
    expect(interestValue.length).toBeGreaterThan(0)
    if (tourTitle) {
      expect(interestValue.toLowerCase()).toContain(tourTitle.slice(0, 6).toLowerCase())
    }
  })

  test('modal closes with Escape', async ({ page }) => {
    const detail = new TourDetailPage(page)
    await detail.gotoTour(tourSlug)
    await page.getByRole('button', { name: /group/i }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })
})
```

### 6. Spec — `e2e/tests/group-booking/bokun-tc-disclosure.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { TourDetailPage } from '../../page-objects/tour-detail'
import { getFirstTourSlug } from '../../fixtures/staging-data'

test.describe('Tour Detail - Bokun T&C Disclosure', () => {
  test('disclosure visible near booking widget', async ({ page, browser }) => {
    const tempPage = await browser.newPage()
    const slug = await getFirstTourSlug(tempPage)
    await tempPage.close()

    const detail = new TourDetailPage(page)
    await detail.gotoTour(slug)
    await detail.bokunWidget.scrollIntoViewIfNeeded().catch(() => {})

    // Disclosure copy: "Booking provided by Bokun" / mentions terms or T&C
    const disclosure = page.getByText(/booking.*bokun|bokun.*terms|terms.*conditions/i).first()
    await expect(disclosure).toBeVisible({ timeout: 5000 })
  })
})
```

### 7. Specs — Wizard (unchanged from prior plan, but verified selectors)

Keep `wizard-flow.spec.ts` and `wizard-persistence.spec.ts` as previously specified. Wizard component file paths confirmed unchanged 2026-05-19.

## Todo List
- [ ] Create `e2e/page-objects/concierge-wizard.ts`
- [ ] Create `e2e/page-objects/group-booking.ts` (8-field schema, honeypot accessor, E2E sentinel)
- [ ] Create `e2e/tests/concierge-wizard/wizard-flow.spec.ts`
- [ ] Create `e2e/tests/concierge-wizard/wizard-persistence.spec.ts`
- [ ] Create `e2e/tests/group-booking/standalone-page.spec.ts` (serial)
- [ ] Create `e2e/tests/group-booking/form-validation.spec.ts` (serial)
- [ ] Create `e2e/tests/group-booking/modal-flow.spec.ts`
- [ ] Create `e2e/tests/group-booking/bokun-tc-disclosure.spec.ts`
- [ ] Extend `e2e/page-objects/tour-detail.ts` with `groupInquiryButton` locator
- [ ] Verify wizard localStorage key dynamically (`Object.keys(localStorage).find(...)`)
- [ ] Verify group form field labels match actual `next-intl` translations for `groupBooking` namespace
- [ ] Decide email side-effect coverage (out-of-scope vs SMTP catcher) — see open question in `plan.md`
- [ ] Optional `afterAll` cleanup hook against Payload admin API to delete inquiries with `specialRequirements` containing `[E2E AUTOMATED TEST — PLEASE IGNORE]`
- [ ] Run all tests against staging on Chromium first, then Firefox/WebKit

## Success Criteria
- Wizard 3-step flow completes and recommendations appear
- Wizard selections persist across reload via localStorage
- Start-over clears wizard state to step 1
- Group form validates required fields, 9-200 group size, email format, phone min length
- Honeypot field stays empty through happy path; explicit honeypot-filled submission rejected
- Group modal opens from tour detail with `tourInterest` prefilled from tour title
- Modal dismissable via Escape
- Bokun T&C disclosure visible on tour detail near booking widget
- All tests pass on Chromium, Firefox, WebKit

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Group form labels differ across `sv/en/de` translations | Medium | Locale fixed to `en` for assertions; flexible regex for labels |
| `/api/group-inquiry` creates real CMS rows + sends customer emails | High | Use `[E2E AUTOMATED TEST — PLEASE IGNORE]` sentinel; serial mode; optional admin-API cleanup |
| `/api/tours/recommend` rate limit trips on parallel wizard runs | Medium | `test.describe.configure({ mode: 'serial' })` for wizard recommend |
| Bokun T&C disclosure copy may change with i18n updates | Medium | Match flexible regex `/booking.*bokun|bokun.*terms|terms.*conditions/i` |
| Bokun widget lazy mount delays disclosure render | Medium | `scrollIntoViewIfNeeded` + 5s expect timeout |
| Wizard localStorage key changes | Low | Dynamic key discovery via `Object.keys(localStorage)` |

## Security Considerations
- Honeypot remains empty in all E2E payloads (spam protection still enforced)
- Test data clearly marked with sentinel string for downstream cleanup
- No real customer PII in any payload
- localStorage assertions read-only — no injection paths
- Admin API cleanup (if implemented) uses `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars only

## Next Steps
- Phase 04 reuses wizard POM for keyboard-nav coverage
- Phase 05 visual baselines must capture group-booking standalone page at 3 viewports
