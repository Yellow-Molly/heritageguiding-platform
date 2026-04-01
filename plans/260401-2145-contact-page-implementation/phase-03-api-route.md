# Phase 3: API Route — POST /api/contact

**Priority:** High | **Effort:** M | **Status:** Complete
**Depends on:** Phase 1 (CMS collection), Phase 4 (email templates)

## Overview

Create API endpoint for contact form submission with Zod validation, rate limiting, honeypot, email notifications, and CMS persistence.

## Related Files
- **Reference:** `apps/web/app/api/group-inquiry/route.ts`
- **Create:** `apps/web/app/api/contact/route.ts`
- **Use:** `apps/web/lib/rate-limit-by-ip.ts`
- **Use:** Phase 4 email functions

## Zod Schema

```typescript
const contactSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal('')),
  subject: z.enum(['general', 'tour_booking', 'group_inquiry', 'partnership', 'other']),
  message: z.string().min(10).max(2000),
  honeypot: z.string().max(0),  // spam trap
})
```

## Implementation Steps

1. Create `apps/web/app/api/contact/route.ts`
2. Parse + validate body with Zod
3. Check honeypot field (reject silently if filled)
4. Rate limit: `checkRateLimit(ip)` — 5 req/min
5. Save to Payload CMS `contact-inquiries` collection
6. Send emails in parallel (admin notification + customer confirmation)
7. Return 200 on success, 400 on validation error, 429 on rate limit

## Response Format

```typescript
// Success
{ success: true, message: 'Message sent successfully' }

// Validation error
{ success: false, errors: [{ field: 'email', message: '...' }] }

// Rate limit
{ success: false, message: 'Too many requests' }
```

## Todo
- [ ] Create API route file
- [ ] Implement Zod validation
- [ ] Add honeypot check
- [ ] Add rate limiting
- [ ] Save to CMS
- [ ] Send emails
- [ ] Test error handling
