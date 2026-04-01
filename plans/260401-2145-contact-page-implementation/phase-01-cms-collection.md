# Phase 1: CMS Collection — ContactInquiries

**Priority:** Medium | **Effort:** S | **Status:** Complete

## Overview

Create a `ContactInquiries` Payload CMS collection to persist contact form submissions. Follows the same pattern as `group-inquiries.ts`.

## Related Files
- **Reference:** `packages/cms/collections/group-inquiries.ts`
- **Create:** `packages/cms/collections/contact-inquiries.ts`
- **Modify:** `packages/cms/payload.config.ts` (register collection)

## Implementation Steps

1. Create `packages/cms/collections/contact-inquiries.ts`:

```typescript
// Fields:
// - fullName: text (required)
// - email: email (required, indexed)
// - phone: text (optional)
// - subject: select (general | tour_booking | group_inquiry | partnership | other)
// - message: textarea (required)
// - status: select (new | read | replied | archived) [default: 'new']
// - adminNotes: textarea (admin sidebar)
// - notificationSent: checkbox (admin sidebar, readonly)
```

2. Access control:
   - `read`: isAdmin
   - `create`: `() => true` (public)
   - `update`: isAdmin
   - `delete`: isAdmin

3. Register in `payload.config.ts` imports and collections array.

## Todo
- [ ] Create collection file
- [ ] Register in payload config
- [ ] Verify admin panel shows collection
