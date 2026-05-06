# Phase 01 Data Artifact — DRAFT

> **Status:** DRAFT pending user verification. Replace `<TBD>` markers with verified values before Phase 03 starts.
> **Legend:** ✅ confirmed · 📝 draft / best guess · ⏳ unknown, user must provide

Created: 2026-05-03

---

## Legal Entity (§01 Parties)

| Token | Status | Value |
|-------|--------|-------|
| `{{LEGAL_ENTITY_NAME}}` | ✅ | `Yellow Molly Aktiebolag` |
| `{{ORG_NR}}` | ✅ | `559577-5080` |
| `{{VAT_NR}}` | ⏳ | `<TBD>` — operator to provide. Likely `SE559577508001` per Skatteverket convention; do NOT publish without verification. |
| `{{F_SKATT_STATUS}}` | ⏳ | `<TBD>` — operator to confirm. Default omit clause if unknown rather than assume. |
| `{{REGISTERED_ADDRESS}}` | ✅ | `Karlavägen 18, 114 31 Stockholm` |
| `{{CONTACT_EMAIL}}` | ✅ | `info@privatetours.se` (from `apps/web/lib/contact-constants.ts`) |
| `{{COMPLAINT_EMAIL}}` | ⏳ | `<TBD>` — operator to confirm shared vs dedicated. Phase 03 will draft as `info@privatetours.se` and update if a dedicated address is later created. |
| Phone | ⏳ | `<TBD>` — operator to provide or confirm "omit". |

**Action required from operator:**
- [ ] Provide VAT no. (verify formula `SE559577508001`)
- [ ] Confirm F-skatt status (godkänd / not registered)
- [ ] Confirm complaint email (shared with `info@` or dedicated)
- [ ] Provide phone or confirm "omit"

---

## Liability Insurance (§13)

| Item | Status | Value |
|------|--------|-------|
| `{{LIABILITY_INSURANCE_REF}}` | ⏳ | `<TBD>` — operator to provide. If "none", §13 will state liability cap only without insurance reference. |

**Action required:** provide carrier + policy ref, or confirm "none".

---

## Governing Law & Venue (§17)

| Token | Status | Value |
|-------|--------|-------|
| `{{COMPETENT_COURT}}` | ✅ | `Stockholms tingsrätt` (Karlavägen 18 → Östermalm → Stockholm municipality → Stockholms tingsrätt jurisdiction) |

---

## Sub-Processors (Privacy patch + §15)

Audited from codebase 2026-05-03.

| # | Sub-processor | Role | Status | Source |
|---|---------------|------|--------|--------|
| 1 | **Bokun (Tripadvisor LLC)** | Booking platform (checkout, vouchers) | ✅ | brainstorm decision |
| 2 | **Adyen N.V.** | Payment acquirer (via Bokun Pay) | ✅ | brainstorm decision |
| 3 | **Google LLC** | Maps / map tile delivery | ✅ | UI uses Google Maps embeds |
| 4 | **Vercel Inc.** | Hosting + edge delivery | ✅ | Next.js on Vercel (project tech stack) |
| 5 | **Supabase Inc.** | Postgres database (eu-north-1 region) | ✅ | `.env.local` `DATABASE_URL` |
| 6 | **Resend** | Transactional email (booking confirmations from `bookings@privatetours.se`) | ✅ | `apps/web/.env.example` `RESEND_API_KEY` |
| 7 | Analytics provider | (none detected) | 📝 | No Plausible/GA/Vercel Analytics in package.json — confirm "none" or add |
| 8 | Review platform | TripAdvisor / Google Reviews / none | ⏳ | not detected in codebase |

`{{SUB_PROCESSORS}}` token value (provisional):

```
Bokun (Tripadvisor LLC), Adyen N.V., Google LLC (Maps), Vercel Inc. (hosting),
Supabase Inc. (database), Resend (transactional email)
```

**Action required:**
- [ ] Confirm "no analytics provider" or name one if added
- [ ] Confirm review platform list (TripAdvisor / Google Reviews / both / none)
- [ ] Confirm DPA agreements signed with each (compliance hygiene — not blocking copy)

---

## Currencies (§5)

| Item | Status | Value |
|------|--------|-------|
| Primary | ✅ | `SEK` |
| `{{ADDITIONAL_CURRENCIES}}` | ✅ | `none` — SEK only |

---

## Last Updated (§ Header / `LEGAL_DATES`)

| Token | Status | Value |
|-------|--------|-------|
| `{{LAST_UPDATED}}` | ⏳ | Set during Phase 07 to actual publish date (YYYY-MM-DD) |

---

## Design Clarifications (RESOLVED 2026-05-03)

| Q | Decision |
|---|----------|
| Q1 — Repeat-pattern sections (02–06, 09–10, 12–15, 17–19) | ✅ YES, repeat patterns. No bespoke per-section layouts. |
| Q2 — Tablet ToC breakpoint | ✅ 1024 (lg). Sidebar on lg+; horizontal grid on md; accordion on <md. |
| Q3 — Promote `--color-secondary-tint` + 2 text-on-primary tokens | ✅ YES. Add to `globals.css :root` + `@theme inline`. |

---

## Outstanding Items — TEMPORARY BLANKS (non-blocking)

Per operator direction, all phases proceed with safe defaults below. Operator updates JSON in a small follow-up commit after publish. None of these block Phase 07.

| Item | Default during drafting | Operator post-publish action |
|------|-------------------------|------------------------------|
| VAT no. | Literal `<VAT-TBD>` placeholder visible in §01 | Single-line JSON edit (`SE559577508001` likely) |
| F-skatt status | Clause omitted from §01 | Add clause if confirmed `godkänd` |
| Insurance carrier | §13 insurance reference omitted; liability cap only | Add reference if carrier confirmed |
| Phone | Phone line omitted from §01 | Add line if provided |
| Complaint email | `info@privatetours.se` (shared) | Update if dedicated `complaints@` created |
| Analytics provider | Privacy disclosure says "none" | Add provider if introduced |
| Review platform | Privacy disclosure omits | Add platform if introduced |

**Note:** Phase 03 EN draft must show the literal `<VAT-TBD>` marker visibly (not Swiss-cheese the section). Pass 1 review will confirm the placeholder is the only `<…-TBD>` in published JSON.

---

## Update Log

- 2026-05-03 — Initial draft created. Codebase audit identified Supabase + Resend as additional sub-processors beyond the original brainstorm list (Bokun, Adyen, Google, Vercel).
- 2026-05-03 — Operator confirmed: legal entity `Yellow Molly Aktiebolag`, org.nr `559577-5080`, address `Karlavägen 18, 114 31 Stockholm`, currencies `SEK only`. Other items moved to Action Items list in plan.md.
