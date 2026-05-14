# Phase 02 Security Fixes — Code Review

**Date:** 2026-05-14
**Reviewer:** code-reviewer subagent
**Scope:** Diff from this session only (Fix 3, Fix 5, deferred cache invalidation)
**Verdict:** APPROVE WITH ONE CONCERN (deferred cache-invalidation reasoning is incorrect)

---

## Summary

5/5 critical security fixes shipped. Fix 3 and Fix 5 implemented correctly. Tests well-structured. Singleton race resolved. One concern: the deferred cache-invalidation rationale (comment in `webhook/route.ts:94-96`) does not match current Next.js 16 behavior in the same codebase — `revalidateTag(tag, { expire: 0 })` is already in use at `app/api/revalidate/route.ts:36,45` against `unstable_cache` tags. Not blocking for go-live (60s TTL acceptable) but the stated reason is wrong.

---

## Review Against Stated Focus Areas

### 1. Fix 3 — Fail-fast constructor (security goal achieved?) — PASS

`bokun-api-client-with-hmac-authentication.ts:41-56` correctly throws `BokunError` with `CREDENTIALS_MISSING` when either env var is empty/unset.

- `!accessKey || !secretKey` catches: `undefined`, empty string, `null` (process.env never yields null, but falsy guard is exhaustive)
- No silent fallback to `''` — eliminates the prior scenario where HMAC was signed with empty secret and Bokun returned 401 with attacker-useful timing
- Error code `CREDENTIALS_MISSING` differentiates from network/auth errors — good for ops alerting
- Constructor throws BEFORE assigning `this.accessKey` / `this.secretKey` — no partially-constructed instance state can leak

**Edge case considered:** whitespace-only strings (`"   "`) still pass `!secretKey` (truthy string). Bokun would reject the HMAC, but our app would not fail-fast. **Low risk** — env vars from Vercel/CI rarely have whitespace, and Bokun rejection is observable. Not worth tightening.

### 2. Fix 5 — Lazy factory (race eliminated?) — PASS

`getBokunClient()` at lines 207-212 is a textbook lazy singleton. Node.js modules execute synchronously inside a single worker — there is no async window between `if (!_bokunClient)` and `_bokunClient = new BokunApiClient()`. **No race possible within a worker.**

Worker startup timing: each worker has its own module scope, so each worker lazily creates its own client on first use. This is the intended behavior, identical to (and safer than) eager module-load singletons that would have thrown at import time when env was missing.

Removed module-level `export const bokunClient = new BokunApiClient()` — confirmed via grep, no orphan references. `index.ts:13` exports only `getBokunClient`, not the old name.

### 3. `__resetBokunClientForTests` — exposure concern? — ACCEPTABLE

The double-underscore prefix is the conventional signal for "internal/test only" (React, Jest, Vitest all use this). It cannot be guarded by `NODE_ENV` check because Vitest runs in `NODE_ENV=test`, and a NODE_ENV gate would either (a) require duplicating env-stubbing in every test, or (b) be a no-op since the test env already passes any reasonable check.

**Security impact if called in production:** zero — it only nulls a module-level cache. Worst case: next request re-instantiates the client, which is what already happens on cold starts.

**Recommendation:** keep as-is. The `__` prefix + comment ("Test helper") is sufficient. Adding a runtime guard would create a tighter coupling between production code and test framework with no security benefit.

### 4. Removing `isConfigured()` — broke any defensive check? — PASS

Grep confirms zero remaining references to `isConfigured` anywhere in `apps/web`. The previous design (check `isConfigured()` then optionally call API) was actually less safe — callers could forget the check and silently make unauthenticated requests. Fail-fast in constructor is strictly stronger.

### 5. Deferred cache invalidation — CORRECTNESS GAP IN REASONING (not security)

**The comment at `webhook/route.ts:94-96` is factually incorrect:**

> "Next.js 16 changed revalidateTag signature to require a cacheLife profile; our availability layer uses legacy unstable_cache."

`app/api/revalidate/route.ts:9,36,45` already imports `revalidateTag` from `next/cache` and calls it against `unstable_cache` tags (`tours`, `categories`, etc.) with `{ expire: 0 }` as the second arg — and it works. The same pattern would work for the `'bokun-availability'` tag defined at `bokun-availability-service-with-caching.ts:53,56`.

**Why this isn't a security/correctness gap for go-live:**
- 60s TTL is short enough that stale availability self-corrects quickly
- Bokun is source of truth at booking time (real API call), so over-booking isn't possible — stale cache only causes momentary UI lag showing a slot as available after it sold out
- Webhook is best-effort signaling, not a transactional guarantee

**Recommendation (not blocking):** correct the comment to reflect the real reason (low business impact relative to migration cost / not in Phase 02 scope), OR simply add the 3-line invalidation:
```ts
import { revalidateTag } from 'next/cache'
// inside handleBookingCreated/Cancelled/PaymentReceived:
revalidateTag('bokun-availability', { expire: 0 })
```
Either fix the comment, or do the trivial implementation. The current state leaves future maintainers with a misleading note.

### 6. Anything else security-relevant? — TWO MINOR NOTES

**6a. `BokunError` constructor message leaks env var names (line 47)**
The thrown message `"Bokun credentials missing: set BOKUN_API_KEY and BOKUN_SECRET_KEY"` is intended for operators but could surface in error tracking / logs visible to a wider audience. Env VAR NAMES are not secrets, so this is fine. Just confirming the values themselves (`this.accessKey`, `this.secretKey`) are never serialized into errors or `toString` — verified, they aren't.

**6b. `error.message` propagated to API response in availability route**
`availability/route.ts:129` returns `error.message` from `BokunError` directly in the JSON response. If the upstream Bokun API ever returned a message containing internal infrastructure details (rare), this would surface to the public client. **Low risk** — Bokun's error responses are sanitized — but worth a future hardening pass to map error codes to fixed user-facing strings.

---

## Test Quality Review

- 79/79 pass, comprehensive coverage of constructor validation paths (5 distinct cases incl. partial-missing keys)
- Lazy factory tests correctly verify identity (`first === second`) AND reset behavior
- `vi.hoisted` correctly used in mock factories — avoids ReferenceError from variable hoisting
- `vi.useFakeTimers()` properly bracketed with `vi.useRealTimers()` in cleanup — won't leak across tests
- Rate-limit test's "attach rejection handler before advancing timers" pattern is correct (prevents unhandledRejection in Vitest)

---

## Items NOT Reviewed (per scope)

- Fix 1 (timing-safe equality) — already shipped, not in this session diff
- Fix 2 (1MB body cap) — already shipped, not in this session diff
- Fix 4 (date / experienceId validation) — already shipped, not in this session diff
- Rest of codebase outside diff

---

## Unresolved Questions

1. Will the misleading webhook comment confuse future contributors enough to merit a quick correction now? (Suggest: yes — fix the comment in this PR even if you defer the implementation.)
2. Is there value in adding a `process.env.NODE_ENV === 'production'` no-op guard around `__resetBokunClientForTests`? (My recommendation: no, but team may have a stronger "defense in depth" preference.)
3. Should `availability/route.ts:129` map `BokunError` messages to fixed user-facing strings to eliminate residual leak risk? (Out of Phase 02 scope; flag for Phase 03 or future hardening.)

---

**Status:** DONE_WITH_CONCERNS
**Summary:** All 5 critical fixes are correctly implemented. One non-blocking concern: webhook comment's stated reason for deferring cache invalidation is incorrect (the project already uses `revalidateTag` with `unstable_cache` tags successfully). 60s TTL keeps the gap acceptable for go-live.
**Concerns:** Incorrect rationale in `webhook/route.ts:94-96` — recommend fixing the comment or adding the 3-line implementation.
