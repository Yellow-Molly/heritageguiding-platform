# Main Research Findings - Guides Data CMS Integration

## Excel Data Source: `docx/Guides.xlsx`
- **Sheet:** Sheet1, 8 rows (1 header + 7 guides)
- **Columns:** Email, Name, Bio, Certifications, Telephone, Languages, Specializations, Operating Areas, Additional languages

### 7 Real Guides:
1. **Sabine Gruen** - German origin, photo: `Sabine_Grün.jpeg`
2. **Sophie Sahlin** - photo: `Sophie_Sahlin.jpeg`
3. **Anders Boysen** - photo: `Anders_Boysen.jpeg`
4. **Niklas Löfström** - photo: `Niklas_Löfström.jpeg`
5. **Christian Arnet** - photo: `Christian_Arnet.jpeg`
6. **Olof Lars Alvar Näslund** - photo: `Olof_Näslund.jpeg`
7. **Annika Bernholm** - photo: `Annika_Bernholm.jpg`

### Data in Swedish (needs EN/DE translation):
- Bio (full paragraph, ~50-100 words each)
- Certifications (e.g., "Auktoriserad Stockholmsguide (FSAG)")
- Specializations (comma-separated tour types)
- Operating Areas (comma-separated locations)
- Languages field is mixed Swedish/English naming

### Non-translatable fields:
- Email, Name, Telephone, photo filenames

## Current Placeholder State
- `scripts/create-placeholder-guides.ts` creates 9 placeholder slugs like `stockholm-authorized-guide-walking-tour`
- `data/translated-tours.json` references these placeholder slugs in `passThrough.guideSlug`
- No real guide bios, photos, or credentials in CMS currently

## Guide-Tour Mapping Gap
The Excel tour data uses placeholder guide slugs, not real guide names. Need to create a mapping:
- Each placeholder slug → real guide (based on tour specialization matching)
- Or update Tour-data.xlsx column 33 with new real guide slugs

## CMS Collection: `packages/cms/collections/guides.ts`
Fields: name, slug, status, bio (richText, localized), credentials (array, localized), photo (upload→media), email, phone, languages (select), specializations (→categories), operatingAreas (→cities), additionalLanguages

## Frontend Components (all functional, just need real data):
- `apps/web/components/guide/guide-listing-card.tsx` - listing card
- `apps/web/components/guide/guide-detail-header.tsx` - detail header
- `apps/web/components/guide/guide-detail-content.tsx` - bio, credentials, specializations
- `apps/web/components/guide/guide-tours-section.tsx` - guide's tours
- `apps/web/components/tour/guide-card.tsx` - guide card on tour detail page

## API Layer (functional):
- `apps/web/lib/api/get-guides.ts` - listing with filters
- `apps/web/lib/api/get-guide-by-slug.ts` - detail + tours

## i18n Messages:
- `apps/web/messages/{sv,en,de}.json` → `guides` namespace exists with UI labels
- Bio/credentials translations handled by Payload CMS localization (not i18n files)

## Existing Import Pattern:
- `scripts/translate-tour-data.ts` - uses ExcelJS + Claude API for SV→EN/DE translation
- `scripts/import-tour-data.ts` - imports translated JSON into Payload CMS
- `scripts/import-tour-photos.ts` - uploads photos to media collection
- `scripts/payload-bootstrap.ts` - shared Payload initialization
