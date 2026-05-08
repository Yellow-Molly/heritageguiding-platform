# Phase 02 — i18n Content (SV → EN → DE)

## Context Links
- Plan: [plan.md](./plan.md)
- Brainstorm: `plans/reports/brainstorm-260508-2258-privacy-policy-gdpr-rewrite.md` (canonical content source)
- Existing keys: `apps/web/messages/{sv,en,de}.json` namespace `privacy.*`

## Overview
- **Priority:** High
- **Status:** Pending
- **Effort:** ~3-4h (revised down per validation; SV template-adapted instead of scratch-authored)
- Replace existing ~30 `privacy.*` keys with ~120-key GDPR-aligned structure across 3 locales. Author SV first.

## Authoring Strategy (Validation-Locked)

### SV (authoritative) — Template Adaptation
- **Source candidates** (pick one and record URL in plan reports for audit trail):
  - Verksamt.se Swedish business GDPR template (gov-published, neutral)
  - IMY's own published guidance + sample policy structure (https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/informera-de-registrerade/)
  - Datatilsynet (Norwegian DPA) Swedish-language template if applicable
- **Process:**
  1. Pick template, save URL + access date to `plans/reports/sv-template-source-260508.md`
  2. Map template's section structure to our 14-section GDPR structure
  3. Replace template-generic content with our specifics from brainstorm (sub-processors, processing register, retention periods)
  4. Use template's Swedish phrasing for definitions, rights, complaint route — that's the audit-defensible core
  5. Verify no template-specific company names / placeholder text leaks ("Företaget", "Exempelbolaget", etc.)

### DE — AI Self-Translation (Validation-Locked)
- **Process:** Translate SV → DE using AI (Claude/Sonnet or DeepL Pro)
- Add translator-note in `de.json`: `"_meta": { "translation": "ai-self-translated", "reviewedBy": null, "reviewedDate": null }` (excluded from rendered output)
- Acceptable risk: ship to production self-attested; revisit if IMY contact or user feedback flags issues
- Numbers + units localize ("7 år" → "7 Jahre")
- Article references stay in legal Latin form ("Art. 6(1)(b)")

### EN — In-house Polish
- Author EN from the structure shown in this phase doc
- Plain English, avoid legalese where possible
- Same key paths as SV/DE

## Key Insights
- SV is authoritative — Sweden = primary jurisdiction, IMY = supervisory authority. Legal phrasing must be precise.
- Existing privacy.json text claims "Adyen" — REPLACE with "Stripe (via Bokun Pay)".
- Existing text claims "Resend" for email — REPLACE with "Google Workspace".
- Existing text claims "Supabase" — keep (confirmed correct).
- Designer's placeholder brand "Heritage Guiding Sweden" appears nowhere in real content.

## Requirements
- All 14 sections fully populated in SV/EN/DE
- Processing Register: 9 rows × 4 cells = 36 strings per locale
- Sub-Processor Table: 7 rows × 4 cells = 28 strings per locale (provider names stay verbatim across locales; role/transfer translated)
- Rights Accordion: 8 items × 4 strings (name, description, exerciseInstruction, ctaLabel) = 32 strings per locale
- Prose sections: 9 prose sections (Sections 2,3,6,7,10,11,12,13,14)
- Article references ("Art. 6(1)(b)") stay in legal Latin form across all locales
- Numbers + units localize: "7 years" / "7 år" / "7 Jahre"

## i18n Key Structure (final)

```json
{
  "privacy": {
    "meta": {
      "title": "...",
      "description": "..."
    },
    "hero": {
      "breadcrumbHome": "Home",
      "breadcrumbCurrent": "Privacy Policy",
      "title": "Privacy Policy",
      "subtitle": "How Private Tours collects, uses, and protects your personal data — written plainly, in line with the GDPR.",
      "updatedLabel": "Updated"
    },
    "toc": {
      "title": "Jump to section",
      "closeLabel": "Close menu",
      "items": {
        "controller": "Data Controller",
        "scope": "Scope & Definitions",
        "dataCollected": "Personal Data We Collect",
        "purposes": "Purposes & Legal Basis",
        "subProcessors": "Sub-Processors & Recipients",
        "transfers": "International Transfers",
        "retention": "Retention Periods",
        "rights": "Your Rights",
        "complaint": "Right to Lodge a Complaint",
        "cookies": "Cookies",
        "children": "Children's Data",
        "automated": "Automated Decisions",
        "security": "Security",
        "changes": "Changes to This Policy"
      }
    },
    "controller": {
      "heading": "Data Controller",
      "controllerLabel": "WHO WE ARE",
      "contactLabel": "CONTACT",
      "legalName": "Private Tours [COMPANY_LEGAL_NAME] AB",
      "orgNumber": "Org. nr [ORG_NR]",
      "address": ["[REGISTERED_ADDRESS]", "Sweden"],
      "emailLabel": "Email"
    },
    "scope": {
      "heading": "Scope & Definitions",
      "paragraphs": ["...", "..."]
    },
    "dataCollected": {
      "heading": "Personal Data We Collect",
      "intro": "We collect the following categories of personal data:",
      "bullets": [
        "Identity & contact: name, email, phone",
        "Booking: tour selection, date, group size, special requests",
        "Payment metadata: last-4 of card, payment status (full card details handled by Stripe via Bokun — never reach our servers)",
        "Technical: anonymized IP, user agent, page views (web vitals)",
        "Derived: language preference, returning-visitor recognition (localStorage-only)"
      ]
    },
    "purposes": {
      "heading": "Purposes & Legal Basis",
      "caption": "How we use your data — purposes and legal grounds",
      "columnHeaders": {
        "activity": "Activity",
        "data": "Data Categories",
        "basis": "Legal Basis",
        "retention": "Retention"
      },
      "rows": [
        { "activity": "Process tour bookings via Bokun", "dataCategories": "Name, email, phone, booking metadata", "legalBasis": "Art. 6(1)(b) — Contract", "retention": "7 years (Bokföringslag)" },
        { "activity": "Group inquiry form", "dataCategories": "Name, email, phone, group size, requirements", "legalBasis": "Art. 6(1)(b) — Pre-contract", "retention": "24 months" },
        { "activity": "Contact form responses", "dataCategories": "Name, email, message", "legalBasis": "Art. 6(1)(f) — Legitimate interest", "retention": "24 months" },
        { "activity": "Booking confirmation emails", "dataCategories": "Email, booking details", "legalBasis": "Art. 6(1)(b) — Contract", "retention": "Tied to booking" },
        { "activity": "Concierge wizard preferences", "dataCategories": "Audience + interest selections", "legalBasis": "Art. 6(1)(a) — Consent (localStorage only)", "retention": "Until cleared" },
        { "activity": "Web Vitals metrics", "dataCategories": "Anonymized perf data, truncated IP", "legalBasis": "Art. 6(1)(f) — Legitimate interest", "retention": "90 days" },
        { "activity": "Tour catalog semantic search", "dataCategories": "Tour content embeddings only — no user data", "legalBasis": "Art. 6(1)(f) — Legitimate interest", "retention": "Rebuilt on content change" },
        { "activity": "Spam / abuse prevention", "dataCategories": "IP, request rate", "legalBasis": "Art. 6(1)(f) — Legitimate interest", "retention": "30 days" },
        { "activity": "Tax record retention", "dataCategories": "Booking + invoice data", "legalBasis": "Art. 6(1)(c) — Legal obligation", "retention": "7 years (Bokföringslag)" }
      ]
    },
    "subProcessors": {
      "heading": "Sub-Processors & Recipients",
      "intro": "We share data only with providers required to deliver the service. Each operates under a Data Processing Agreement.",
      "caption": "Trusted partners who help deliver this service",
      "columnHeaders": {
        "provider": "Provider",
        "role": "Role",
        "location": "Location",
        "transfer": "Transfer Mechanism"
      },
      "rows": [
        { "provider": "Bokun (Tripadvisor LLC)", "monogram": "B", "role": "Booking platform", "location": "Iceland / United States", "transfer": "EU SCCs" },
        { "provider": "Stripe (via Bokun Pay)", "monogram": "S", "role": "Payment processing", "location": "Ireland (EU) / United States", "transfer": "EU SCCs + DPF" },
        { "provider": "Vercel Inc.", "monogram": "V", "role": "Web hosting + Blob storage", "location": "United States (EU edge regions)", "transfer": "EU SCCs + DPF" },
        { "provider": "Supabase Inc.", "monogram": "S", "role": "PostgreSQL database (EU region)", "location": "European Union", "transfer": "DPA + EU region" },
        { "provider": "OpenAI", "monogram": "O", "role": "Embeddings — tour catalog content only, no user data", "location": "United States", "transfer": "EU SCCs" },
        { "provider": "Google Workspace", "monogram": "G", "role": "Transactional email (SMTP)", "location": "United States (EU region)", "transfer": "EU SCCs + DPF" },
        { "provider": "Meta Platforms (WhatsApp)", "monogram": "W", "role": "Deep-link only — user-initiated chat", "location": "EU / United States", "transfer": "User-initiated; not our processing" }
      ]
    },
    "transfers": {
      "heading": "International Transfers",
      "paragraphs": ["...", "..."]
    },
    "retention": {
      "heading": "Retention Periods",
      "intro": "We keep personal data only as long as necessary:",
      "bullets": [
        "Booking + invoice records: 7 years (Swedish Bookkeeping Act)",
        "Group / contact inquiries: 24 months from last contact",
        "Anonymized analytics: 90 days",
        "Spam / abuse logs: 30 days",
        "Concierge preferences: until you clear browser localStorage"
      ]
    },
    "rights": {
      "heading": "Your Rights",
      "items": [
        { "id": "access", "numeral": "01", "name": "Right of access", "description": "Get a copy of your personal data we hold.", "exerciseInstruction": "Email info@privatetours.se with subject 'GDPR Access Request'.", "ctaLabel": "Request access", "mailtoSubject": "GDPR Access Request" },
        { "id": "rectification", "numeral": "02", "name": "Right to rectification", "description": "Correct inaccurate or incomplete data.", "exerciseInstruction": "...", "ctaLabel": "Request correction", "mailtoSubject": "GDPR Rectification Request" },
        { "id": "erasure", "numeral": "03", "name": "Right to erasure", "description": "Have your data deleted where we have no overriding legal duty to retain it.", "exerciseInstruction": "...", "ctaLabel": "Request deletion", "mailtoSubject": "GDPR Erasure Request" },
        { "id": "restriction", "numeral": "04", "name": "Right to restrict processing", "description": "Limit how we use your data while a dispute is resolved.", "exerciseInstruction": "...", "ctaLabel": "Request restriction", "mailtoSubject": "GDPR Restriction Request" },
        { "id": "portability", "numeral": "05", "name": "Right to data portability", "description": "Receive your data in a machine-readable format.", "exerciseInstruction": "...", "ctaLabel": "Request export", "mailtoSubject": "GDPR Portability Request" },
        { "id": "object", "numeral": "06", "name": "Right to object", "description": "Object to processing based on our legitimate interest.", "exerciseInstruction": "...", "ctaLabel": "Object to processing", "mailtoSubject": "GDPR Objection" },
        { "id": "withdraw", "numeral": "07", "name": "Right to withdraw consent", "description": "Withdraw consent at any time, without affecting prior lawful processing.", "exerciseInstruction": "...", "ctaLabel": "Withdraw consent", "mailtoSubject": "GDPR Consent Withdrawal" },
        { "id": "automated", "numeral": "08", "name": "Right not to be subject to automated decisions", "description": "We do not make decisions with legal effect about you using automation alone.", "exerciseInstruction": "...", "ctaLabel": "Learn more", "mailtoSubject": "GDPR Automated Decision Inquiry" }
      ],
      "slaCallout": "We respond to all rights requests within 30 days. Free of charge."
    },
    "complaint": {
      "heading": "Right to Lodge a Complaint",
      "body": "If you believe we have mishandled your personal data, contact us first — we'll work to resolve it. You also have the right to complain directly to the Swedish Authority for Privacy Protection (IMY).",
      "primaryCtaLabel": "Contact us first",
      "secondaryCtaLabel": "Visit IMY (imy.se)",
      "secondaryCtaAriaLabel": "Visit IMY website (opens in new tab)"
    },
    "cookies": {
      "heading": "Cookies & Similar Technologies",
      "intro": "We use only strictly necessary cookies and equivalent storage:",
      "bullets": [
        "Locale preference cookie (so your language choice persists)",
        "Session security tokens (CSRF protection)",
        "Anonymized Web Vitals — first-party, no third-party trackers"
      ],
      "trailing": "Because we use only essential cookies, no consent banner is required under ePrivacy."
    },
    "children": {
      "heading": "Children's Data",
      "body": "Our service is intended for adults aged 16 and over. Children under 16 cannot create bookings on this site. Children may participate in tours as accompanied guests of an adult booker. If we learn we have collected personal data from someone under 16, we will delete it within 30 days."
    },
    "automated": {
      "heading": "Automated Decisions & Profiling",
      "body": "Our concierge wizard suggests tours based on audience and interest selections you provide. These selections are stored only in your browser's localStorage — we never receive them on our servers. The wizard offers recommendations only; you remain in full control of your choices. This is not an automated decision under Article 22 GDPR."
    },
    "security": {
      "heading": "Security",
      "body": "We protect personal data using industry-standard measures: TLS encryption in transit, encryption at rest, role-based access control, and audit logging. In the event of a personal data breach affecting your rights, we will notify the supervisory authority within 72 hours and inform affected individuals without undue delay."
    },
    "changes": {
      "heading": "Changes to This Policy",
      "body": "We update this policy when our processing changes. The 'Updated' date in the hero reflects the latest revision. Material changes will be communicated via on-site notice. Prior versions are available in the project's public git history."
    },
    "contactCta": {
      "heading": "Privacy questions?",
      "emailDisplay": "info@privatetours.se",
      "responseSla": "We respond within 12 hours."
    }
  }
}
```

## Implementation Steps
1. **SV draft (authoritative):**
   - Open `apps/web/messages/sv.json`, locate `"privacy"` namespace
   - Replace entire `privacy.*` object with structure above, all values translated to Swedish
   - Use Swedish legal terminology: "Personuppgiftsansvarig" (Controller), "Behandling" (Processing), "Rättslig grund" (Legal basis), "Lagringstid" (Retention), "Rättigheter" (Rights), "Klagomål" (Complaint), "IMY · Integritetsskyddsmyndigheten"
   - Article references stay as "Art. 6(1)(b)" etc. — universal
   - Numbers: "7 år", "30 dagar", "72 timmar", "24 månader"
2. **EN draft:**
   - Use the structure shown above (already in EN); paste into `apps/web/messages/en.json` privacy namespace
   - Polish phrasing: plain English, avoid legalese where possible
3. **DE draft:**
   - Translate from SV (or EN) into German
   - German legal terms: "Verantwortlicher" (Controller), "Verarbeitung" (Processing), "Rechtsgrundlage" (Legal basis), "Speicherdauer" (Retention), "Betroffenenrechte" (Rights), "Beschwerderecht" (Complaint), reference "Bundesbeauftragte für den Datenschutz und die Informationsfreiheit" only as supplementary — primary auth = IMY
   - Numbers: "7 Jahre", "30 Tage", "72 Stunden", "24 Monate"
4. **Verification grep:**
   - `grep -i "adyen\|heritage guiding sweden\|resend" apps/web/messages/*.json` → must return ZERO matches
   - `grep -c "privacy" apps/web/messages/sv.json` → key count expansion confirmed

## Todo List
- [ ] Replace `privacy.*` namespace in `apps/web/messages/sv.json` (authoritative)
- [ ] Replace `privacy.*` namespace in `apps/web/messages/en.json`
- [ ] Replace `privacy.*` namespace in `apps/web/messages/de.json`
- [ ] Verify ZERO matches: "Adyen", "Heritage Guiding Sweden", "Resend"
- [ ] Verify key parity: same key paths in all 3 locales
- [ ] Verify JSON syntactic validity in all 3 files
- [ ] Manual translation review pass (each locale read top-to-bottom for fluency)

## Success Criteria
- All 3 message files contain identical `privacy.*` key paths (no drift)
- Zero forbidden brand/processor names ("Adyen", "Heritage Guiding Sweden", "Resend")
- All 9 Processing Register rows present per locale
- All 7 Sub-Processor rows present per locale
- All 8 Rights items present per locale
- JSON parses cleanly (`npm run type-check` does not break next-intl typing)
- Sweden-specific references: IMY, Bokföringslag, Sverige

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Translation drift between locales | Phase 5 i18n parity test catches structural drift |
| Legal phrasing inaccurate in DE | Flag for professional legal translation review pre-launch (out-of-band) |
| JSON syntax errors break next-intl | `npm run type-check` after each locale change |
| Designer placeholder copy "Heritage Guiding Sweden" leaks | Explicit grep block in test (Phase 5) |

## Security Considerations
- No secrets in i18n files
- Email addresses are public-facing — `info@privatetours.se` only

## Next Steps
- Phase 3: Page composition wires components to these keys
