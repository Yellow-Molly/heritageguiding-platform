# Bokun Outbound Integration v1: Content Corruption Found in Code Review

**Date**: 2026-05-14 16:00
**Severity**: High
**Component**: Bokun integration (outbound sync), lexical HTML serialization
**Status**: Resolved with architectural workaround

## What Happened

Built Phases 2–6 of the Bokun outbound sync: API client extension, Bokun mapper, admin UI fields, Payload Jobs task, admin sync panel, and POST endpoint. Code review identified a silent data corruption bug in the existing `lexicalToHtml` helper that would ship unnoticed.

## The Brutal Truth

The existing tour mapper's `lexicalToHtml` helper strips unknown HTML tags during sanitization. User content like "AT&T Tours **<Best> in Town**" gets mangled to "AT&T Tours in Town" — the `<Best>` tag silently disappears. This isn't a display bug; it's persistent data loss once written to Bokun. Code review caught it immediately. Would have shipped and corrupted customer tours in production.

## Technical Details

**Root issue**: `lexicalToHtml` serializes Lexical JSON → HTML string → sanitizer removes unknown tags. Text like "AT&T" has no escaping, so `<Best>` looks like a tag to the sanitizer and gets stripped.

**Example**:
```
Input: "AT&T Tours <Best> in Town"
After HTML creation: "<p>AT&T Tours <Best> in Town</p>"
After sanitize: "<p>AT&T Tours in Town</p>"  // <Best> stripped
```

**Decision**: Created `lexical-to-bokun-html.ts` that escapes text nodes **before** serialization, preserving content integrity. Existing `lexicalToHtml` left untouched (frontend rendering is out of scope for this plan).

Code reviewer also flagged:
- Missing CSRF origin check on admin endpoint (SameSite=Lax insufficient for POSTs)
- Error whitelist was missing 408 (HMAC clock skew) and 503/504 (gateway timeout)
- 410 Gone should clear `bokunExperienceId` to allow re-creation, not loop forever
- Secret redaction was under-aggressive (now catches 40+ char opaque tokens)

## What We Tried

1. **First approach**: Sanitize output after serialization → caught the bug but caused data loss
2. **Fix applied**: Escape input before serialization → preserves fidelity, no sanitizer bypass

## Root Cause Analysis

**Why it wasn't caught earlier**: The existing `lexicalToHtml` function works fine for frontend rendering (user sees correct content), so the bug is invisible until you push to a third-party API. No unit tests existed for this path. Payload's sanitizer silently succeeds while corrupting content.

**Why it happened**: Underestimated the difference between "safe for DOM rendering" and "safe for external API". Two different threat models.

## Lessons Learned

1. **Escaping happens twice**: Input escaping (content preservation) and output escaping (security) are separate concerns. Don't conflate them.
2. **Fork when scope diverges**: The frontend `lexicalToHtml` path wasn't being changed. Created a Bokun-specific fork (`lexical-to-bokun-html.ts`) instead of trying to refactor the shared helper. DRY violation, but scoped fix beats mission creep — flagged as tech debt for later.
3. **External API integrations need extra scrutiny**: Data written to third-party systems won't come back for you to fix. Test these paths harder.

## Next Steps

- **Phase 7 canary** (deferred): Verify locale codes (sv/en/de) against live Bokun account — currently assumed based on Bokun docs, not tested
- **Frontend fix** (out of scope, defer): Same content corruption risk exists in tour detail page rendering — update `lexicalToHtml` universally once database access available for `payload generate:types`
- **Type debt**: Several `as Record<string, unknown>` type-casts remain pending a full type generation pass — not blocking, but should run when we have DB access
- **Tech debt log**: Document the `lexicalToHtml` fork decision and revisit during next refactoring cycle

## Final Metrics

- 168 tests passing (↑31 from 137 before this session)
- 0 typecheck errors in new code
- Code review score: 7.5/10 (2 blockers resolved, 5 highs addressed)
- Ship-ready for phases 2–6; Phase 7 (manual canary) deferred pending Bokun account access
