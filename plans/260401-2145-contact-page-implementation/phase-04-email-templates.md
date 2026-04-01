# Phase 4: Email Templates

**Priority:** High | **Effort:** S | **Status:** Complete

## Overview

Create admin notification and customer confirmation email functions for contact inquiries. Follow existing patterns from group inquiry emails.

## Related Files
- **Reference:** `apps/web/lib/email/send-inquiry-notification-to-admin.ts`
- **Reference:** `apps/web/lib/email/send-inquiry-confirmation-to-customer.ts`
- **Create:** `apps/web/lib/email/send-contact-notification-to-admin.ts`
- **Create:** `apps/web/lib/email/send-contact-confirmation-to-customer.ts`

## Implementation Steps

### Admin Notification
1. Create `send-contact-notification-to-admin.ts`
2. Subject: `"New Contact: {subject} — {fullName}"`
3. HTML table with all form fields (HTML-escaped)
4. Send to `GMAIL_USER` (admin email)

### Customer Confirmation
1. Create `send-contact-confirmation-to-customer.ts`
2. Subject: `"We received your message — Private Tours"`
3. Simple acknowledgment: thank you, 24-hour response promise
4. Professional HTML template matching brand

## Todo
- [ ] Create admin notification email
- [ ] Create customer confirmation email
