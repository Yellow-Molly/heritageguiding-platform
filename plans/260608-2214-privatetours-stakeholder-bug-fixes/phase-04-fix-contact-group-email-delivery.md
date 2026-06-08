---
phase: 4
title: "Fix Contact + Group Email Delivery"
status: completed
priority: P1
effort: "3h + ops"
dependencies: []
---

# Phase 4: Fix Contact + Group Email Delivery (Bug #4)

## Overview

The contact form "succeeds" on the surface but no email is delivered; the group-inquiry form shares part of the same root cause. Two distinct defects, fixed per-route (see Root cause), plus an ops step. For **contact**, submission data is NOT lost — it is persisted to the Payload `contact-inquiries` collection before the email attempt; only the notification fails. For **group-inquiry**, there is no such persistence (data-loss risk flagged below).

## Root cause (verified in code)

1. **Unawaited fire-and-forget send — CONTACT ROUTE ONLY** — `app/api/contact/route.ts:65-85` builds `Promise.all([...]).then(...).catch(console.error)` but never `await`s it; the route returns `200` at line 87 immediately. On **Vercel serverless the function instance can suspend/freeze right after the response**, so the floating email promise is dropped. No `after()` / `waitUntil` is used. ⚠️ The group-inquiry route does **NOT** have this defect — it `await`s `Promise.all` at `group-inquiry/route.ts:42` before responding (returns 500 to the user on failure). The scout's claim that they share this pattern was incorrect; verified against source.
2. **Missing recipient env var — BOTH ROUTES** — both admin senders read `to: process.env.ADMIN_EMAIL!` (`send-contact-notification-to-admin.ts:30`, `send-inquiry-notification-to-admin.ts:22`) with a non-null assertion. `ADMIN_EMAIL` is **absent from `.env.example` and `deployment-guide.md`** → if unset in production, the admin send targets `undefined` → contact: throws, swallowed by `.catch(console.error)`, user still sees success; group-inquiry: throws, caught, returns 500. This is the genuinely shared defect across the two forms.
3. **Errors are invisible (contact)** — `.catch(console.error)` only logs; `@sentry/nextjs` (v10.53.1, configured in repo via `sentry.server.config.ts` + `instrumentation.ts`) is not used here, so failures don't surface.

Decision: recipient = `info@privatetours.se`; fix BOTH routes. Note the two routes need **different** fixes (contact needs the await/`after()` fix + recipient; group-inquiry needs only the recipient + Sentry visibility).

## Diagnosis note (which defect is actually biting?)

Both defects are real and cheap to fix, so the plan fixes both regardless. But note the asymmetry for triage: if `ADMIN_EMAIL` is **set** in prod, contact still fails purely from the fire-and-forget drop (#1) while group-inquiry works (it awaits) — consistent with the stakeholder reporting only the contact form. If `ADMIN_EMAIL` is **unset**, group-inquiry would be returning visible 500s too. Checking the Vercel env + the `contact-inquiries` rows (`notificationSent: false`) at implementation time will confirm which is dominant.

## Architecture of the fix

- **Contact route:** run the email work in **`after()` from `next/server`** (stable in Next.js 16) instead of the floating promise. `after()` runs post-response (instant UX, no SMTP wait) AND Vercel keeps the function alive until it completes → the send is no longer dropped. Persistence stays before the response (unchanged safety net). Extract the email + `notificationSent` update into a single awaitable helper so it is unit-testable and `after()` just calls it. **Fallback:** plain `await Promise.all([...])` before responding — exactly what the working group-inquiry route already does; simpler and proven in-repo, at the cost of a ~1-3s response wait. Either fixes the drop; do not keep the floating promise.
- **Both routes:** read the recipient through a **fail-loud helper** (`getAdminEmail()`) that throws a clear error if unset (no more silent `undefined`), and replace `console.error` / bare 500s with `Sentry.captureException` so delivery failures are visible.
- **Group-inquiry route:** keep its existing blocking `await`; it inherits the recipient fix via `getAdminEmail()` and gains Sentry visibility. No `after()`.
- Document + set `ADMIN_EMAIL` everywhere (`.env.example`, deployment guide, Vercel).

## Related Code Files

- **Create:** `apps/web/lib/email/get-admin-email.ts` — `export function getAdminEmail(): string` that returns `process.env.ADMIN_EMAIL` or throws `Error('ADMIN_EMAIL env var is not set')`. DRY shared by both admin senders.
- **Modify:** `apps/web/lib/email/send-contact-notification-to-admin.ts` — `to: getAdminEmail()` (drop `!`).
- **Modify:** `apps/web/lib/email/send-inquiry-notification-to-admin.ts` — `to: getAdminEmail()` (drop `!`).
- **Modify:** `apps/web/app/api/contact/route.ts` — replace fire-and-forget block (65-85) with an extracted `sendContactEmails(...)` called inside `after(() => ...)`; wrap in try/catch → `Sentry.captureException`.
- **Modify:** `apps/web/app/api/group-inquiry/route.ts` — **keep the existing blocking `await`** (it already delivers correctly when the recipient is set). The recipient fix is inherited automatically once its admin sender uses `getAdminEmail()`. Add a `try/catch` → `Sentry.captureException` around the send so failures are visible instead of only a generic 500. Do **not** convert to `after()` here (see risk: it has no DB persistence, so swallowing a failure post-response would lose the inquiry entirely).
- **Modify:** `apps/web/.env.example` — add `ADMIN_EMAIL=info@privatetours.se` under the email block (after line 46).
- **Modify:** `docs/deployment-guide.md` — add `ADMIN_EMAIL` to the email env section (~line 160-162).
- **Create (optional, dev tool):** `apps/web/scripts/verify-email-transport.mjs` — loads env, calls `transporter.verify()`, optionally sends one test mail. For local/staging credential smoke-testing.
- **Modify tests:** `app/api/contact/__tests__/route.test.ts`, `app/api/group-inquiry/__tests__/route.test.ts`, and the email-sender tests — assert the extracted `sendContactEmails`/`sendInquiryEmails` helper is invoked and that a missing `ADMIN_EMAIL` throws.

## Implementation Steps

1. **Recipient helper:** create `get-admin-email.ts`; switch both admin senders from `process.env.ADMIN_EMAIL!` to `getAdminEmail()`.
2. **Contact route refactor:** extract the two sends + the `notificationSent: true` update into `async function sendContactEmails(payload, inquiry, data)`. In `POST`, after persisting, schedule it:
   ```ts
   import { after } from 'next/server'
   import * as Sentry from '@sentry/nextjs'
   // ...persist inquiry...
   after(async () => {
     try {
       await sendContactEmails(payload, inquiry, data)
     } catch (err) {
       Sentry.captureException(err, { tags: { route: 'contact', inquiryId: String(inquiry.id) } })
     }
   })
   return NextResponse.json({ success: true, message: 'Message sent successfully' })
   ```
3. **Group-inquiry route:** leave the blocking `await Promise.all([...])` as-is (already correct). Wrap it in `try/catch` and call `Sentry.captureException(err, { tags: { route: 'group-inquiry' } })` before the existing 500 response so failures are observable. No `after()` conversion. The recipient fix comes for free via `getAdminEmail()` in its admin sender.
4. **Env + docs:** add `ADMIN_EMAIL=info@privatetours.se` to `.env.example` and the deployment guide email section. Note clearly it must be set in Vercel for all environments.
5. **OPS (must be done by a human with Vercel access — code alone cannot deliver email):**
   - Set `ADMIN_EMAIL=info@privatetours.se` in Vercel → Project → Settings → Environment Variables (Production + Preview + Development).
   - Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are present in Production and that `GMAIL_APP_PASSWORD` is a **current Google App Password** (16-char, not the account password; account must have 2FA). Regenerate if stale.
   - Redeploy so the new env vars take effect.
6. **Verify SMTP creds** (pre-deploy, optional): run `node apps/web/scripts/verify-email-transport.mjs` with prod-equivalent env → expect `transporter.verify()` success.
7. **Update tests** per the file list; ensure `getAdminEmail()` throw path is covered.
8. Type-check, lint, run the contact + group-inquiry + email suites.

## Success Criteria

- [ ] Submitting `/en/contact` delivers an email to `info@privatetours.se` AND a confirmation to the submitter's address.
- [ ] Submitting the group-inquiry form delivers both emails too.
- [ ] Contact email send runs inside `after()` (or awaited) — no floating promise; route still returns success with the inquiry persisted first.
- [ ] `getAdminEmail()` throws a clear error (captured by Sentry) when `ADMIN_EMAIL` is unset — no silent send to `undefined`.
- [ ] `ADMIN_EMAIL` documented in `.env.example` + `deployment-guide.md`, and set in Vercel (all envs).
- [ ] Delivery failures surface in Sentry (not just console).
- [ ] `npm run type-check` + `npm run lint` + affected `npm test` suites green.
- [ ] Post-deploy: a fresh test submission produces a `contact-inquiries` row with `notificationSent: true`.

## Risk Assessment

- **`after()` behavior** → confirm `after` is exported from `next/server` on the pinned Next 16.2.6 (it is stable since 15). If a constraint blocks it, fallback = `await` the sends before responding (≈1-2s latency, still correct). Do not revert to floating promises.
- **Gmail deliverability** → `service: 'gmail'` works with an App Password + 2FA. Watch for: expired/disabled app password, Google "suspicious sign-in" blocks, daily send limits, and SPF/DKIM so `info@`-bound mail isn't spam-filtered. The verify script + a real inbox check are the proof.
- **Recipient correctness** → `info@privatetours.se` per stakeholder; confirm that inbox is actually monitored.
- **Scope (group-inquiry)** → included by decision, but its fix differs: only the recipient env var + Sentry. It already `await`s (no fire-and-forget drop) and surfaces failures as a 500.
- **Group-inquiry has NO DB persistence (data-loss risk)** → unlike contact, the route emails only — it does not write to a collection. If the send fails, the inquiry is lost. README Phase 09 claims a `GroupInquiries` Payload collection exists, but this route does not write to it (discrepancy). **Follow-up (out of scope here):** verify whether group inquiries should be persisted like contact, and if so add the write before the send. Flag to stakeholder; do not silently expand this phase.
- **Existing stuck rows** → after the fix, historical `contact-inquiries` with `notificationSent: false` represent messages that were saved but never emailed. Consider a one-time manual review of that collection so no past lead is missed (ops follow-up, not code).

## Verification (end-to-end)

1. Deploy with env set.
2. Submit the live contact form with a test message.
3. Confirm: (a) email arrives at `info@privatetours.se`, (b) confirmation arrives at the test sender, (c) the new `contact-inquiries` row shows `notificationSent: true`, (d) no Sentry error.
4. Repeat for the group-inquiry form.
