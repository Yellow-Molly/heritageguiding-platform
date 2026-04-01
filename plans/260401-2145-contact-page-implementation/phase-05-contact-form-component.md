# Phase 5: Contact Form Component

**Priority:** High | **Effort:** L | **Status:** Complete
**Depends on:** Phase 2 (translations)

## Overview

Client-side contact form component with validation, loading states, success/error feedback. Follows `group-inquiry-form.tsx` pattern.

## Related Files
- **Reference:** `apps/web/components/booking/group-inquiry-form.tsx`
- **Create:** `apps/web/components/contact/contact-form.tsx`

## Design Specs (from Pencil)

### Desktop (inside left column)
- White card, `border-radius: 24px`, shadow, padding 40px
- Title: "Send us a message" — Playfair Display 28px, `#1E3A5F`
- Fields stacked vertically, gap 20px
- Inputs: pill shape (`border-radius: 9999px`), height 48px, padding 0 20px, border `#E5E7EB`
- Labels: Inter 14px 500, `#2D3748`
- Placeholders: Inter 14px, `#9CA3AF`
- Subject: dropdown with chevron-down icon
- Message textarea: `border-radius: 16px`, height 140px
- Submit button: `#E67E5A`, pill, height 52px, full width, Inter 16px 600 white

### Mobile
- Same fields, padding `32px 20px`
- Title: Playfair Display 24px

## Form States
- `idle` — default
- `loading` — disabled fields, spinner on button
- `success` — green check + success message
- `error` — red alert box + error message

## Implementation Steps

1. Create `apps/web/components/contact/contact-form.tsx` ('use client')
2. Form state management with useState
3. Client-side validation before submit
4. Honeypot hidden field
5. POST to `/api/contact`
6. Handle success/error responses
7. Use `useTranslations('contact')` for all text
8. Style with Tailwind matching design specs

### Field Implementation
```tsx
// Each field pattern:
<div className="flex flex-col gap-1.5">
  <label className="font-inter text-sm font-medium text-gray-800">{t('form.fullName')}</label>
  <input
    type="text"
    className="h-12 rounded-full border border-gray-200 px-5 text-sm ..."
    placeholder={t('form.fullNamePlaceholder')}
  />
  {errors.fullName && <span className="text-sm text-red-500">{errors.fullName}</span>}
</div>
```

### Subject Dropdown
- Use native `<select>` styled to match design (pill, chevron)
- Options from translation keys
- **[VALIDATED]** Support URL query param `?subject=partnership` to pre-select subject on page load (via `useSearchParams`)

## Todo
- [ ] Create contact form component
- [ ] Implement all form fields
- [ ] Add client-side validation
- [ ] Add honeypot field
- [ ] Handle form submission
- [ ] Add loading/success/error states
- [ ] Style to match Pencil design
