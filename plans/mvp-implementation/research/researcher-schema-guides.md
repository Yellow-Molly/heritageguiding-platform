# Schema.org Structured Data for Tour Guide Platform

Research on best practices for implementing Schema.org JSON-LD markup for guide profiles, listings, bookings, and utility pages.

## 1. Individual Guide Profile Pages

**Recommended Type:** `Person` with tourism-specific properties

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "John Smith",
  "jobTitle": "Licensed Tour Guide",
  "description": "Expert heritage guide specializing in medieval architecture",
  "image": "https://example.com/guides/john-smith.jpg",
  "url": "https://example.com/guides/john-smith",
  "knowsLanguage": ["en", "de", "fr"],
  "knowsAbout": ["Medieval Architecture", "Local History", "Heritage Sites"],
  "hasOccupation": {
    "@type": "Occupation",
    "name": "Tour Guide",
    "occupationalCategory": "Tour Guide"
  },
  "award": ["Certified Heritage Guide 2024"],
  "rating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

**Alternative:** Use `Person` as part of `LocalBusiness` employee roster if your platform acts as tour operator.

## 2. Guide Listing Pages

**Recommended Type:** `ItemList` with `ListItem` containing `Person` entities

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Heritage Tour Guides",
  "description": "Browse our certified heritage tour guides",
  "numberOfItems": 24,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://example.com/guides/john-smith",
      "item": {
        "@type": "Person",
        "name": "John Smith",
        "image": "https://example.com/guides/john-smith.jpg",
        "jobTitle": "Licensed Tour Guide"
      }
    },
    {
      "@type": "ListItem",
      "position": 2,
      "url": "https://example.com/guides/jane-doe",
      "item": {
        "@type": "Person",
        "name": "Jane Doe",
        "image": "https://example.com/guides/jane-doe.jpg",
        "jobTitle": "Heritage Specialist"
      }
    }
  ]
}
```

**Best Practice:** Use `position` property for ordered lists. For summary pages, include only `type`, `position`, `url` in `ListItem`. For all-in-one pages, include full `Person` schema.

## 3. Group Booking / Service Pages

**Recommended Type:** `TouristTrip` with `Offer` for bookings

```json
{
  "@context": "https://schema.org",
  "@type": "TouristTrip",
  "name": "Medieval Heritage Walking Tour",
  "description": "3-hour guided tour of historic sites",
  "touristType": "Group",
  "itinerary": {
    "@type": "ItemList",
    "itemListElement": [
      {"@type": "TouristAttraction", "name": "Cathedral Square"},
      {"@type": "TouristAttraction", "name": "Old Town Hall"}
    ]
  },
  "offers": {
    "@type": "Offer",
    "price": "450.00",
    "priceCurrency": "EUR",
    "priceSpecification": {
      "@type": "PriceSpecification",
      "minPrice": "450.00",
      "price": "450.00",
      "priceCurrency": "EUR",
      "eligibleQuantity": {
        "@type": "QuantitativeValue",
        "minValue": 9,
        "maxValue": 25
      }
    },
    "availability": "https://schema.org/InStock",
    "validFrom": "2026-03-01"
  },
  "provider": {
    "@type": "Person",
    "name": "John Smith",
    "jobTitle": "Tour Guide"
  }
}
```

## 4. Privacy/Terms Legal Pages

**Recommended Type:** `WebPage` subtypes - minimal schema needed

```json
{
  "@context": "https://schema.org",
  "@type": "PrivacyPolicy",
  "name": "Privacy Policy",
  "url": "https://example.com/privacy",
  "dateModified": "2026-02-15"
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "TermsAndConditions",
  "name": "Terms of Service",
  "url": "https://example.com/terms",
  "dateModified": "2026-02-15"
}
```

**Note:** Schema.org provides `PrivacyPolicy` and `TermsAndConditions` as PolicyPage subtypes. Minimal markup sufficient - no rich results expected.

## 5. Tour Finder / Recommendation Wizard

**Recommended Type:** `Guide` (Product/Buying Guide) or basic `WebPage`

```json
{
  "@context": "https://schema.org",
  "@type": "Guide",
  "name": "Find Your Perfect Tour",
  "description": "Answer a few questions to get personalized tour recommendations",
  "about": {
    "@type": "Thing",
    "name": "Heritage Tours"
  }
}
```

**Alternative:** No specific schema needed for interactive wizards. Consider adding breadcrumbs instead:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com"},
    {"@type": "ListItem", "position": 2, "name": "Find Tour"}
  ]
}
```

## Sources

- [Person - Schema.org](https://schema.org/Person)
- [ItemList - Schema.org](https://schema.org/ItemList)
- [Google Carousel Structured Data](https://developers.google.com/search/search/docs/appearance/structured-data/carousel)
- [TouristTrip - Schema.org](https://schema.org/TouristTrip)
- [PrivacyPolicy/TermsAndConditions Discussion](https://github.com/schemaorg/schemaorg/issues/2350)
- [Guide - Schema.org](https://schema.org/Guide)
- [JSON-LD Best Practices](https://growthnatives.com/blogs/seo/top-json-ld-schema-patterns-for-ai-search-success/)

## Unresolved Questions

None - schema coverage clear for all page types.
