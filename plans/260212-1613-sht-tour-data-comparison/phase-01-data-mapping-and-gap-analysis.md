# Phase 1-3: Data Mapping & Gap Analysis

## SHT Source Overview

| Attribute | Value |
|-----------|-------|
| Total tours | ~59 (22 transported + 37 walking) |
| Price range | SEK 120 – 9,858 |
| Duration range | 1h – 13h |
| Booking system | **FareHarbor** (not Bokun) |
| Languages | EN (primary), SV, DE, FR, ES, RU, Persian |
| Max group size | 16 (public), flexible (private) |
| Guides | ~14 named guides with area-specific authorization |
| Operating areas | Stockholm, Uppsala, Sigtuna, Vallentuna, countryside |
| Company | 2 principals (Owe + Jonathan), founded 2015 |

## Direct Field Mappings (data exists on SHT)

| SHT Data | Platform Field | Notes |
|----------|---------------|-------|
| Tour name | `title` (localized) | Available in EN; SV translation needed |
| Tour description | `description` (richText) | Plain text → Lexical JSON conversion |
| Short blurb | `shortDescription` | Needs truncation to 160 chars |
| Price (from SEK X) | `pricing.basePrice` | "From" price = base price |
| Duration (hours) | `duration.hours` | Direct map, e.g. "3 hours" → 3 |
| Duration text | `duration.durationText` | "Approximately 3 hours" |
| Public/Private | Could use `priceType` | per_person (public) vs per_group (private) |
| Hotel pickup info | `logistics.meetingPointInstructions` | "Within 4km of central station" |
| Meeting point | `logistics.meetingPointName` | Varies per tour |
| Guide info | `guide` relationship | Need to create Guide entries first |
| Tour category | `categories` relationship | Need category mapping (see Phase 4) |

## Gap Analysis: SHT Data Missing for Platform Fields

| Platform Field | Required? | Gap Assessment |
|----------------|-----------|----------------|
| `slug` | YES | Auto-generate from title |
| `shortDescription` | YES | Extract from descriptions, max 160 chars |
| `highlights` | NO | Can derive from tour descriptions |
| `pricing.currency` | YES | Always SEK |
| `pricing.priceType` | YES | Need to classify per_person vs per_group |
| `pricing.childPrice` | NO | Not listed on SHT site |
| `logistics.coordinates` | NO | Need to geocode meeting points |
| `logistics.googleMapsLink` | NO | Need to generate |
| `targetAudience` | NO | Can derive from tour themes |
| `difficultyLevel` | NO | Most walking = "easy", transported = "easy" |
| `accessibility` | NO | **Not mentioned on SHT** — needs manual input |
| `bokunExperienceId` | NO | **SHT uses FareHarbor, not Bokun** |
| `seo.metaTitle` | NO | Can auto-generate from title |
| `seo.metaDescription` | NO | Can use shortDescription |
| `images` | YES (practical) | SHT has images but need to download/re-upload |
| `neighborhoods` | NO | Need to map Stockholm areas to existing neighborhoods |

## Enrichment Opportunities

- **Included/Not Included lists**: SHT mentions some inclusions (transport, guide, museum entry) but not consistently
- **whatToBring**: Not on SHT site — needs manual input per tour
- **ageRecommendation**: Not specified — needs manual assessment
- **maxGroupSize**: SHT says max 16 for public tours

## Guide Data Mapping

SHT has ~14 guides. Platform requires:

| SHT Guide Data | Platform Guide Field | Available? |
|---------------|---------------------|------------|
| Name | `name` | YES (14 names listed) |
| Bio | `bio` | Partial (only Owe & Jonathan have bios) |
| Credentials | `credentials` | YES (area authorizations listed) |
| Photo | `photo` | Some available on SHT site |
| Email | `email` | Only company email available |
| Languages | `languages` | YES (mapped per guide) |

## Compatibility Summary

| Aspect | Compatibility | Notes |
|--------|--------------|-------|
| Tour content fields | **HIGH** | Most SHT data maps well to platform fields |
| Guide data | **MEDIUM** | Need to collect missing bios/photos/emails |
| Categories | **MEDIUM** | Need ~9 new category entries |
| Booking integration | **LOW** | FareHarbor ≠ Bokun — biggest gap |
| Localization | **MEDIUM** | EN content exists; SV/DE translations needed |
| Images | **MEDIUM** | Exist but need migration |
| Accessibility data | **LOW** | Not available from SHT |
| SEO data | **HIGH** | Can auto-generate from content |
| Geographic/map data | **MEDIUM** | Meeting points known, need geocoding |
