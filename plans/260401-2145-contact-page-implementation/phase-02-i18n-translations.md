# Phase 2: i18n Translations

**Priority:** High | **Effort:** M | **Status:** Complete

## Overview

Add `contact` namespace translations for EN, SV, DE.

## Related Files
- **Modify:** `apps/web/messages/en.json`
- **Modify:** `apps/web/messages/sv.json`
- **Modify:** `apps/web/messages/de.json`

## Translation Keys

```json
{
  "contact": {
    "meta": {
      "title": "Contact Us - Private Tours",
      "description": "Get in touch for private heritage tours in Sweden..."
    },
    "hero": {
      "title": "Let's Plan Your Journey",
      "subtitle": "Whether you're dreaming of a private walking tour through Gamla Stan or a cultural voyage across Sweden — we'd love to hear from you."
    },
    "form": {
      "title": "Send us a message",
      "fullName": "Full Name",
      "fullNamePlaceholder": "Enter your full name",
      "email": "Email Address",
      "emailPlaceholder": "Enter your email address",
      "phone": "Phone Number",
      "phoneOptional": "(Optional)",
      "phonePlaceholder": "+46",
      "subject": "Subject",
      "subjectPlaceholder": "Select a subject",
      "subjectOptions": {
        "general": "General Inquiry",
        "tourBooking": "Tour Booking",
        "groupInquiry": "Group Inquiry",
        "partnership": "Partnership",
        "other": "Other"
      },
      "message": "Message",
      "messagePlaceholder": "Tell us about your dream tour...",
      "submit": "Send Message",
      "sending": "Sending...",
      "successTitle": "Message Sent!",
      "successMessage": "Thank you for reaching out. We'll get back to you within 24 hours.",
      "errorMessage": "Something went wrong. Please try again.",
      "required": "This field is required",
      "invalidEmail": "Please enter a valid email address",
      "messageTooShort": "Message must be at least 10 characters"
    },
    "info": {
      "title": "Contact Information",
      "subtitle": "We typically respond within 24 hours.",
      "emailLabel": "Email",
      "emailValue": "info@privatetours.se",
      "phoneLabel": "Phone",
      "phoneValue": "+46 70 123 45 67",
      "addressLabel": "Visit Us",
      "addressValue": "Drottninggatan 5, 111 51 Stockholm",
      "hoursLabel": "Business Hours",
      "hoursValue": "Mon-Fri, 08:00-18:00 CET",
      "followUs": "Follow Us"
    },
    "quickLinks": {
      "label": "HOW CAN WE HELP?",
      "title": "Quick Links",
      "subtitle": "Find the right place to start your journey",
      "bookTour": {
        "title": "Book a Private Tour",
        "description": "Ready to explore? Browse our curated heritage experiences and book your private guide today.",
        "link": "Explore tours"
      },
      "forGuides": {
        "title": "For Tour Guides",
        "description": "Are you a licensed guide? Join our growing network of heritage specialists and connect with international visitors.",
        "link": "Partner with us"
      },
      "faq": {
        "title": "Frequently Asked",
        "description": "Find answers to common questions about our tours, booking process, cancellation policies, and group sizes.",
        "link": "Visit FAQ"
      }
    },
    "trust": {
      "fastResponse": "Fast Response",
      "fastResponseSub": "We reply within 24 hours",
      "multilingual": "Multilingual Support",
      "privacy": "Your Privacy Matters",
      "privacySub": "GDPR compliant \u2022 Data encrypted",
      "fiveStar": "5-Star Rated",
      "fiveStarSub": "Trusted by 2,000+ travelers"
    }
  }
}
```

## Implementation Steps

1. Add `contact` namespace to `en.json` with all keys above
2. Translate to Swedish in `sv.json`
3. Translate to German in `de.json`
4. Keep keys consistent across all 3 files

## Todo
- [ ] Add English translations
- [ ] Add Swedish translations
- [ ] Add German translations
