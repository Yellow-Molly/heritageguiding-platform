---
title: "Stakeholder Bug Fixes — private.tours (4 items)"
description: "Fix 4 stakeholder-reported items: Why-Travel-With-Us copy, guide linked-tours removal, wrong contact address, broken contact/group email delivery."
status: completed
priority: P1
created: 2026-06-08
---

# Stakeholder Bug Fixes — private.tours (4 items)

## Overview

Four independent stakeholder items from the 2026-06-07 bug report. Each maps to one phase, is independently shippable, and touches non-overlapping files (safe to do in any order or parallel). Phase 4 (email) is the only real backend bug and carries an **ops step** (set a Vercel env var) the code cannot do alone.

Source bug report: 2 content/copy changes (#1, #3), 1 content removal (#2), 1 delivery bug (#4).

## Stakeholder decisions (confirmed 2026-06-08)

- **#4 recipient inbox** → `info@privatetours.se` (matches `.env.example` `NEXT_PUBLIC_CONTACT_EMAIL`).
- **#4 scope** → fix **both** the contact route AND the group-inquiry route (identical root cause, shared mailer).
- **#1 translations** → draft Swedish + German now, flag for native-speaker review before launch.
- **#2 guide sticky CTA** → remove it (its only purpose was scrolling to the now-removed tours).

## Phases

| Phase | Name | Bug | Risk | Status |
|-------|------|-----|------|--------|
| 1 | [Why-Travel-With-Us Content](./phase-01-why-travel-with-us-content.md) | #1 | Low | Done |
| 2 | [Remove Guide Linked Tours](./phase-02-remove-guide-linked-tours.md) | #2 | Low | Done |
| 3 | [Fix Contact Address](./phase-03-fix-contact-address.md) | #3 | Low | Done |
| 4 | [Fix Contact + Group Email Delivery](./phase-04-fix-contact-group-email-delivery.md) | #4 | Med | Done |

## Dependencies

- **Inter-phase:** none. All four phases edit disjoint files.
- **External ops (Phase 4 only):** `ADMIN_EMAIL` must be set in Vercel (all environments); `GMAIL_USER` / `GMAIL_APP_PASSWORD` must be verified valid in production. Code fix alone does not deliver email without these.
- **Cross-plan:** none. Net-new fixes; prior plans (contact-page-implementation, guide-profile-redesign, mvp-launch-content-audit) are completed and not blocked.

## Validation commands (per phase)

```bash
cd /Users/caodoa/heritageguiding-platform
npm run type-check        # tsc — no errors
npm run lint              # eslint
npm test                  # vitest (run affected suites)
```

## Notes / follow-ups for stakeholder

- **#1**: New copy reuses the existing animated number+label card design — big gold number ("100%", "0") + label + description. SV/DE drafts need native review.
- **#4**: After deploy, the diagnostic signal is the Payload `contact-inquiries` collection — existing rows with `notificationSent: false` confirm "persisted but email failed."
