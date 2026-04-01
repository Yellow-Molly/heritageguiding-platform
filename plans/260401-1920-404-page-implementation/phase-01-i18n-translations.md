---
phase: 1
title: Add i18n translations for 404 page
status: completed
priority: medium
effort: S
completed: 2026-04-01
---

# Phase 1: Add i18n Translations

## Overview

Add translation keys for the 404 page content in all 3 locales (sv, en, de).

## Files to Modify

- `apps/web/messages/en.json`
- `apps/web/messages/sv.json`
- `apps/web/messages/de.json`

## Translation Keys

Add a new `notFound` namespace:

```json
{
  "notFound": {
    "title": "Page Not Found",
    "heading": "Oops! Looks like you took a wrong turn",
    "subtext": "Don't worry — even seasoned explorers get lost in Stockholm's winding streets. Our guide is here to help you find your way back!",
    "speechBubble": "\"Follow me! I know a shortcut!\"",
    "homeButton": "Take Me Home",
    "toursButton": "Show Me Around",
    "searchPlaceholder": "Search for tours, destinations...",
    "helpText": "Or try finding your way here",
    "funFact": "Fun fact: Gamla Stan has 51 streets — no wonder you got lost!"
  }
}
```

## Implementation Steps

1. Add `notFound` key to `en.json` with English text (from design)
2. Add `notFound` key to `sv.json` with Swedish translations
3. Add `notFound` key to `de.json` with German translations

## Success Criteria

- [x] All 3 locale files have `notFound` namespace
- [x] Keys match what the component will consume

## Completion Summary

Translations added to all 3 locale files:
- `apps/web/messages/en.json` — English translations added
- `apps/web/messages/sv.json` — Swedish translations added
- `apps/web/messages/de.json` — German translations added

All keys include city names (Stockholm, Gothenburg, Visby) as needed for location tags.
