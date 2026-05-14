# Phase 02 Security Fixes — Bokun Go-Live Preparation

**Date**: 2026-05-14 14:00  
**Severity**: High  
**Component**: Bokun API Client, Authentication, Configuration Management  
**Status**: Resolved

## What Happened

Completed Phase 02 of the Bokun go-live security audit. Started with 5 critical fixes required; audit-first approach revealed 3 were already shipped from prior work. Implemented fixes 3 and 5, plus cache invalidation bonus. All 79 tests pass. Code review approved with one concern that was addressed same-session.

## The Brutal Truth

This session was supposed to be a slog. Instead, it wasn't — because we actually checked what was already done before coding. Saved roughly 3 hours of redundant work writing tests and justifications for fixes that shipped weeks ago. The irony: the most painful moment came not from the hard work, but from a **dumb mistake in my own reasoning** when something seemed harder than it should.

## Technical Details

**Implemented Fix 3 — Constructor Validation**
```typescript
// Before: threw lazily when BOKUN_API_KEY or BOKUN_SECRET_KEY missing
// After: throws immediately in constructor, fails fast
if (!this.apiKey || !this.secretKey) {
  throw new Error('[BokunApiClient] Missing required environment variables');
}
```
Removed the `isConfigured()` guard pattern entirely. Singleton pattern required fail-at-startup semantics.

**Implemented Fix 5 — Lazy Singleton Factory**
```typescript
// Before: module-level export const bokunClient = new BokunApiClient()
// After: lazy getter with test reset hook
export function getBokunClient(): BokunApiClient {
  if (!_bokunClient) {
    _bokunClient = new BokunApiClient();
  }
  return _bokunClient;
}
export function __resetBokunClientForTests(): void {
  _bokunClient = null;
}
```
Updated 2 consumers (`apps/web/app/api/tours/[slug]/availability/route.ts`, `apps/web/app/api/tours/availability/route.ts`) + barrel export. Eliminates race condition on build-time env evaluation.

**Bonus: Cache Invalidation**
Added `revalidateTag('bokun-availability', { expire: 0 })` to 3 webhook handlers. Tested immediately after implementation.

## What We Tried

Initially attempted `revalidateTag('bokun-availability')` without the second arg. Next.js 16 type-check rejected it. **This is where the painful reasoning mistake happened**: I looked at the error, saw that it now required a `cacheLife` profile, and wrote a deferral comment: _"Next.js 16 migration friction not worth it for 60s TTL — skip this bonus."_

Turned out to be completely wrong. Same codebase already uses `revalidateTag(tag, { expire: 0 })` at `apps/web/app/api/revalidate/route.ts:36,45`. I just didn't grep first.

## Root Cause Analysis

**Why the audit-first approach worked:** The plan listed 5 fixes, but didn't verify which were already shipped. A quick grep on prior commits found timing-safe equals, 1MB body limit, and date+experienceId validation all landed 2-3 weeks ago. Scope shrank 60% immediately.

**Why I wrote a dumb deferral comment:** False assumption that "API surface looks hard = new API surface introduced in migration." Didn't validate that assumption by checking existing usage. When something seems unexpectedly complex, the codebase often has the answer already.

## Lessons Learned

1. **Audit before commit planning.** 5 fixes on the whiteboard vs. 2 actual remaining fixes is a massive delta. Saves days of misdirected work.

2. **Grep before deferring.** When an API looks harder than it should, search the codebase for prior working usages. 30 seconds of grep beats 30 minutes of code + comments explaining why you're taking the easy way out.

3. **Constructor validation + lazy singletons = solid pattern.** Fail fast at startup, defer instantiation to first real use, provide test reset hook. No race conditions, predictable lifecycle.

4. **Tests are the guardrail for confidence.** 10 new tests + 5 removed tests = 79 passing. Tells you immediately if the pattern holds.

## Next Steps

1. User reviewing diff before commit — holding for explicit approval.
2. Phase 02 marked complete in plan; Phase 03/04 remain blocked on external credentials (not blocking).
3. Side-observation: `deployment-guide.md` references `BOKUN_ACCESS_KEY`, code uses `BOKUN_API_KEY`. Pre-existing drift, out of scope for Phase 02. Flag for Phase 04 docs sync.
4. On approval: commit, push, await Phase 01 commercial onboarding completion before Phase 03 proceeds.

---

**Unresolved Questions:**
- None. Session complete and validated.
