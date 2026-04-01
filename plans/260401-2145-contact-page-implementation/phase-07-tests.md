# Phase 7: Tests

**Priority:** High | **Effort:** M | **Status:** Complete
**Depends on:** All previous phases

## Overview

Unit tests for contact form, API route, email templates, and CMS collection.

## Test Files to Create
- `apps/web/components/contact/__tests__/contact-form.test.tsx`
- `apps/web/app/api/contact/__tests__/route.test.ts`
- `apps/web/lib/email/__tests__/send-contact-notification-to-admin.test.ts`
- `apps/web/lib/email/__tests__/send-contact-confirmation-to-customer.test.ts`
- `packages/cms/collections/__tests__/contact-inquiries.test.ts`

## Test Coverage Targets

### Contact Form Component
- Renders all fields (name, email, phone, subject, message)
- Shows validation errors on empty submit
- Shows email format error
- Shows message length error
- Honeypot field is hidden
- Successful submission shows success message
- Failed submission shows error message
- Loading state disables form
- All translations render correctly

### API Route
- Returns 400 on invalid body
- Returns 400 on missing required fields
- Returns 200 on valid submission
- Honeypot rejection (silent 200)
- Rate limiting returns 429
- Calls email functions
- Saves to CMS collection

### Email Templates
- Admin email contains all form fields
- Admin email subject includes name and subject
- Customer email addresses correct recipient
- HTML escaping prevents injection

### CMS Collection
- Collection config has correct fields
- Access control: public create, admin-only read/update/delete
- Status field defaults to 'new'

## Todo
- [ ] Write contact form tests
- [ ] Write API route tests
- [ ] Write email template tests
- [ ] Write CMS collection tests
- [ ] Run all tests and verify pass
